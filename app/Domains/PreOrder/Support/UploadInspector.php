<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Support;

use App\Domains\PreOrder\Exceptions\PreOrderRuleException;
use GdImage;
use Throwable;

/**
 * Decides whether a file a center sent may enter the document store. Only PDF, PNG and JPEG are
 * accepted, and the type is read from the bytes, never from the name or the sender's claim.
 *
 *  - Images are decoded and re-encoded into a new file. Whatever else the original carried
 *    (metadata, a polyglot payload, a trailing archive, script after the image data) is not
 *    copied, and an image too large to decode safely is refused before decoding.
 *  - PDFs are refused when they can run anything: JavaScript, launch or submit actions, embedded
 *    files, rich media, XFA forms, automatic actions. Names are de-obfuscated (#xx escapes) and
 *    object streams are inflated before the search, so neither hides a keyword. Encrypted PDFs
 *    are refused, since they can't be inspected.
 *  - When a ClamAV daemon is configured (services.clamav.host) every file is also scanned, and
 *    a scanner that can't be reached refuses the file instead of letting it through.
 *
 * api runs a first check before it accepts a file; this one is the gate that counts.
 */
final class UploadInspector
{
    public const MAX_BYTES = 20 * 1024 * 1024;

    /** Larger images are refused: decoding one could exhaust memory (a decompression bomb). */
    private const MAX_PIXELS = 40_000_000;

    private const MAX_SIDE = 12_000;

    /** @var array<string, array{0: string, 1: string}> magic bytes => [extension, mime type] */
    private const SIGNATURES = [
        '%PDF-' => ['pdf', 'application/pdf'],
        "\x89PNG\r\n\x1a\n" => ['png', 'image/png'],
        "\xFF\xD8\xFF" => ['jpg', 'image/jpeg'],
    ];

    /** PDF names that make a document act rather than display. */
    private const PDF_ACTIVE = [
        'JavaScript', 'JS', 'Launch', 'SubmitForm', 'ImportData', 'EmbeddedFile', 'EmbeddedFiles',
        'RichMedia', 'XFA', 'AA', 'GoToE', 'GoToR', 'Sound', 'Movie', 'Rendition',
    ];

    public function inspect(string $path, string $claimedExtension): InspectedUpload
    {
        $size = is_file($path) ? filesize($path) : false;
        if ($size === false || $size === 0) {
            throw new PreOrderRuleException('The file is empty or missing.');
        }
        if ($size > self::MAX_BYTES) {
            throw new PreOrderRuleException('The file is larger than 20 MB.');
        }

        [$extension, $mimeType] = $this->sniff($path);
        $claimed = strtolower($claimedExtension) === 'jpeg' ? 'jpg' : strtolower($claimedExtension);
        if ($claimed !== $extension) {
            throw new PreOrderRuleException('The file content does not match its type. Only PDF, PNG and JPEG files are accepted.');
        }

        $clean = $extension === 'pdf' ? $this->checkPdf($path) : $this->reencode($path, $extension);

        try {
            $this->scan($clean);
        } catch (Throwable $e) {
            @unlink($clean);
            throw $e;
        }

        return new InspectedUpload($clean, $extension, $mimeType);
    }

    /** @return array{0: string, 1: string} */
    private function sniff(string $path): array
    {
        $head = (string) file_get_contents($path, false, null, 0, 16);
        foreach (self::SIGNATURES as $magic => $type) {
            if (str_starts_with($head, $magic)) {
                // Cross-check with libmagic: the leading bytes alone could front something else.
                $detected = (new \finfo(FILEINFO_MIME_TYPE))->file($path);
                if ($detected !== $type[1]) {
                    break;
                }

                return $type;
            }
        }

        throw new PreOrderRuleException('Only PDF, PNG and JPEG files are accepted.');
    }

    private function reencode(string $path, string $extension): string
    {
        $info = @getimagesize($path);
        if ($info === false || $info[0] < 1 || $info[1] < 1) {
            throw new PreOrderRuleException('The image could not be read.');
        }
        if ($info[0] > self::MAX_SIDE || $info[1] > self::MAX_SIDE || $info[0] * $info[1] > self::MAX_PIXELS) {
            throw new PreOrderRuleException('The image is too large. Please send it at a lower resolution.');
        }

        $image = $extension === 'png' ? @imagecreatefrompng($path) : @imagecreatefromjpeg($path);
        if (! $image instanceof GdImage) {
            throw new PreOrderRuleException('The image could not be read.');
        }

        $out = $this->tempFile();
        try {
            if ($extension === 'png') {
                imagesavealpha($image, true);
                $ok = imagepng($image, $out, 6);
            } else {
                $ok = imagejpeg($image, $out, 90);
            }
        } finally {
            imagedestroy($image);
        }
        if (! $ok || ! filesize($out)) {
            @unlink($out);
            throw new PreOrderRuleException('The image could not be read.');
        }

        return $out;
    }

    private function checkPdf(string $path): string
    {
        $raw = (string) file_get_contents($path);
        if (! str_contains(substr($raw, -2048), '%%EOF')) {
            throw new PreOrderRuleException('The PDF is incomplete or damaged.');
        }

        // Search the document's structure only: the text outside streams, and object streams
        // (/Type /ObjStm), which hold dictionaries out of plain sight once inflated. Other streams
        // are page drawing and image data; binary bytes there would match short names by chance.
        $texts = [];
        $skeleton = '';
        $offset = 0;
        if (preg_match_all('/stream\r?\n(.*?)\r?\n?endstream/s', $raw, $streams, PREG_OFFSET_CAPTURE)) {
            foreach ($streams[0] as $i => [$whole, $at]) {
                $skeleton .= substr($raw, $offset, $at - $offset);
                $offset = $at + strlen($whole);
                $dictionary = substr($raw, max(0, $at - 1024), min(1024, $at));
                $dictionary = substr($dictionary, (int) strrpos($dictionary, ' obj'));
                if (preg_match('/\/Type\s*\/ObjStm/', $dictionary)) {
                    $inflated = @zlib_decode($streams[1][$i][0], self::MAX_BYTES * 2);
                    if (! is_string($inflated)) {
                        throw new PreOrderRuleException('The PDF is incomplete or damaged.');
                    }
                    $texts[] = $inflated;
                }
            }
        }
        $texts[] = $skeleton.substr($raw, $offset);

        foreach ($texts as $text) {
            // "/J#61vaScript" is "/JavaScript": decode #xx escapes in names before matching.
            $text = (string) preg_replace_callback('/#([0-9A-Fa-f]{2})/', fn (array $m) => chr((int) hexdec($m[1])), $text);
            if (preg_match('/\/Encrypt\b/', $text)) {
                throw new PreOrderRuleException('Password-protected PDFs are not accepted. Please send an unprotected copy.');
            }
            foreach (self::PDF_ACTIVE as $name) {
                if (preg_match('/\/'.$name.'(?![A-Za-z0-9])/', $text)) {
                    throw new PreOrderRuleException('This PDF contains scripts, attachments or actions and is not accepted. Please print it to a new PDF or send a scan.');
                }
            }
        }

        // The original bytes are kept (rewriting a PDF safely needs a full parser); a copy keeps
        // the incoming folder and the store independent.
        $out = $this->tempFile();
        if (! copy($path, $out)) {
            throw new PreOrderRuleException('The file could not be stored.');
        }

        return $out;
    }

    private function scan(string $path): void
    {
        $host = (string) config('services.clamav.host');
        if ($host === '') {
            return;
        }

        $socket = @fsockopen($host, (int) config('services.clamav.port', 3310), $errno, $errstr, 5);
        if ($socket === false) {
            throw new PreOrderRuleException('The file could not be checked for viruses. Please try again later.');
        }
        try {
            stream_set_timeout($socket, 30);
            fwrite($socket, "zINSTREAM\0");
            $file = fopen($path, 'rb');
            while ($file && ! feof($file)) {
                $chunk = (string) fread($file, 8192);
                if ($chunk !== '') {
                    fwrite($socket, pack('N', strlen($chunk)).$chunk);
                }
            }
            if ($file) {
                fclose($file);
            }
            fwrite($socket, pack('N', 0));
            $reply = trim((string) stream_get_contents($socket));
        } finally {
            fclose($socket);
        }

        if (str_ends_with($reply, 'FOUND')) {
            throw new PreOrderRuleException('The file was flagged by the virus scanner and was not accepted.');
        }
        if (! str_ends_with($reply, 'OK')) {
            throw new PreOrderRuleException('The file could not be checked for viruses. Please try again later.');
        }
    }

    private function tempFile(): string
    {
        $path = tempnam(sys_get_temp_dir(), 'preorder-upload-');
        if ($path === false) {
            throw new PreOrderRuleException('The file could not be stored.');
        }

        return $path;
    }
}
