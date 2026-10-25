<?php

declare(strict_types=1);

namespace Tests\Feature\PreOrder;

use App\Domains\PreOrder\Exceptions\PreOrderRuleException;
use App\Domains\PreOrder\Support\UploadInspector;
use Tests\TestCase;

/**
 * The gate every center file passes before it enters the document store: only real PDF, PNG and
 * JPEG, images rebuilt from their pixels, PDFs that can run anything refused.
 */
class UploadInspectorTest extends TestCase
{
    /** @var list<string> */
    private array $files = [];

    protected function tearDown(): void
    {
        foreach ($this->files as $file) {
            @unlink($file);
        }
        parent::tearDown();
    }

    private function file(string $bytes): string
    {
        $path = (string) tempnam(sys_get_temp_dir(), 'inspector-test-');
        file_put_contents($path, $bytes);

        return $this->files[] = $path;
    }

    private function png(int $w = 4, int $h = 4): string
    {
        $image = imagecreatetruecolor($w, $h);
        ob_start();
        imagepng($image);

        return (string) ob_get_clean();
    }

    private function jpeg(): string
    {
        $image = imagecreatetruecolor(4, 4);
        ob_start();
        imagejpeg($image);

        return (string) ob_get_clean();
    }

    /** A minimal valid PDF; $extra lands in the catalog dictionary. */
    private function pdf(string $extra = '', string $body = ''): string
    {
        return "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R {$extra} >>\nendobj\n"
            ."2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\n{$body}"
            ."trailer\n<< /Root 1 0 R >>\n%%EOF\n";
    }

    private function refuses(string $bytes, string $ext, string $message): void
    {
        try {
            $this->inspect($bytes, $ext);
            $this->fail("Expected the file to be refused: $message");
        } catch (PreOrderRuleException $e) {
            $this->assertStringContainsString($message, $e->getMessage());
        }
    }

    private function inspect(string $bytes, string $ext): string
    {
        $upload = app(UploadInspector::class)->inspect($this->file($bytes), $ext);
        $this->files[] = $upload->path;

        return (string) file_get_contents($upload->path);
    }

    public function test_png_and_jpeg_are_rebuilt_from_their_pixels(): void
    {
        // A polyglot: a valid PNG with script appended after the image data.
        $clean = $this->inspect($this->png()."<script>alert(1)</script><?php system('id'); ?>", 'png');
        $this->assertStringStartsWith("\x89PNG", $clean);
        $this->assertStringNotContainsString('<script>', $clean);
        $this->assertStringNotContainsString('<?php', $clean);

        $this->assertStringStartsWith("\xFF\xD8\xFF", $this->inspect($this->jpeg(), 'jpeg'));
    }

    public function test_only_pdf_png_and_jpeg_are_accepted_whatever_the_name_says(): void
    {
        $svg = '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>';
        $this->refuses($svg, 'png', 'Only PDF, PNG and JPEG');
        $this->refuses('<html><script>alert(1)</script></html>', 'pdf', 'Only PDF, PNG and JPEG');
        $this->refuses("GIF89a\x01\x00\x01\x00", 'png', 'Only PDF, PNG and JPEG');
        // A real PNG claiming to be a PDF.
        $this->refuses($this->png(), 'pdf', 'does not match its type');
        $this->refuses('', 'pdf', 'empty');
    }

    public function test_an_image_too_large_to_decode_safely_is_refused_before_decoding(): void
    {
        // A PNG header claiming 20000 x 20000 pixels.
        $ihdr = pack('NN', 20000, 20000)."\x08\x02\x00\x00\x00";
        $png = "\x89PNG\r\n\x1a\n".pack('N', 13).'IHDR'.$ihdr.pack('N', crc32('IHDR'.$ihdr))
            .pack('N', 0).'IEND'.pack('N', crc32('IEND'));

        $this->refuses($png, 'png', 'too large');
    }

    public function test_a_plain_pdf_is_accepted(): void
    {
        $this->assertStringStartsWith('%PDF-', $this->inspect($this->pdf('/OpenAction [2 0 R /Fit]'), 'pdf'));
    }

    public function test_pdfs_that_can_run_anything_are_refused(): void
    {
        $this->refuses($this->pdf('/OpenAction << /S /JavaScript /JS (app.alert(1)) >>'), 'pdf', 'scripts, attachments or actions');
        $this->refuses($this->pdf('/AA << /O << /S /Launch /F (cmd.exe) >> >>'), 'pdf', 'scripts, attachments or actions');
        $this->refuses($this->pdf('/Names << /EmbeddedFiles 3 0 R >>'), 'pdf', 'scripts, attachments or actions');
        // Hex-escaped name: /J#61vaScript is /JavaScript.
        $this->refuses($this->pdf('/OpenAction << /S /J#61vaScript >>'), 'pdf', 'scripts, attachments or actions');
        $this->refuses($this->pdf('/Encrypt 5 0 R'), 'pdf', 'Password-protected');
        $this->refuses("%PDF-1.4\n1 0 obj\n<< >>\nendobj\n", 'pdf', 'incomplete');
    }

    public function test_script_hidden_in_a_compressed_object_stream_is_found(): void
    {
        $objects = (string) gzcompress('3 0 << /S /JavaScript /JS (app.alert(1)) >>');
        $body = "4 0 obj\n<< /Type /ObjStm /N 1 /First 4 /Filter /FlateDecode /Length ".strlen($objects)." >>\nstream\n{$objects}\nendstream\nendobj\n";

        $this->refuses($this->pdf('', $body), 'pdf', 'scripts, attachments or actions');
    }

    public function test_binary_image_data_in_a_pdf_is_not_mistaken_for_an_action(): void
    {
        // Image bytes may contain "/JS" by chance; only the document's structure is searched.
        $data = "\x00\x01/JS /AA\xff\xfe";
        $body = "5 0 obj\n<< /Type /XObject /Subtype /Image /Length ".strlen($data)." >>\nstream\n{$data}\nendstream\nendobj\n";

        $this->assertStringStartsWith('%PDF-', $this->inspect($this->pdf('', $body), 'pdf'));
    }

    public function test_an_unreachable_virus_scanner_refuses_the_file(): void
    {
        config(['services.clamav.host' => '127.0.0.1', 'services.clamav.port' => 1]);

        $this->refuses($this->pdf(), 'pdf', 'could not be checked for viruses');
    }
}
