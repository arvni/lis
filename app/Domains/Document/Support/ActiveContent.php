<?php

declare(strict_types=1);

namespace App\Domains\Document\Support;

use Illuminate\Http\UploadedFile;
use Symfony\Component\Mime\MimeTypes;

/**
 * File types a browser or operating system would run rather than just show.
 *
 * Documents are stored and served from the LIS's own origin, so an uploaded
 * SVG or HTML file opened from a download link would run its script with the
 * viewer's session. Everything else the lab exchanges (PDF, images, Office
 * files, instrument exports, plain text, XML) stays allowed: those are only
 * ever shown inline when they are PDF or a raster image, and served as an
 * attachment otherwise.
 *
 * Both the name and the sniffed content are checked, so renaming page.html
 * to page.txt does not get past it.
 */
final class ActiveContent
{
    /**
     * @var list<string>
     */
    public const EXTENSIONS = [
        'svg', 'svgz',
        'html', 'htm', 'xhtml', 'xht', 'shtml', 'mht', 'mhtml',
        'js', 'mjs',
        'php', 'php3', 'php4', 'php5', 'php7', 'phtml', 'pht', 'phar',
        'jsp', 'asp', 'aspx', 'cgi',
        'exe', 'dll', 'msi', 'bat', 'cmd', 'com', 'scr', 'ps1', 'vbs', 'hta', 'jar', 'swf', 'sh',
    ];

    /**
     * @var list<string>
     */
    public const MIME_TYPES = [
        'image/svg+xml',
        'text/html',
        'application/xhtml+xml',
        'text/javascript',
        'application/javascript',
        'text/x-php',
        'application/x-php',
        'application/x-httpd-php',
        'application/x-msdownload',
        'application/x-dosexec',
        'application/x-executable',
        'application/x-sharedlib',
        'application/x-shockwave-flash',
        'application/java-archive',
        'text/x-shellscript',
        'application/x-sh',
    ];

    /**
     * Types the browser may render inline from the LIS origin: they cannot carry script that runs there.
     *
     * @var list<string>
     */
    public const INLINE_TYPES = [
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/gif',
        'image/webp',
        'image/bmp',
    ];

    public static function isActive(UploadedFile $file): bool
    {
        $extension = strtolower($file->getClientOriginalExtension());
        // Read the bytes ourselves: the upload's own getMimeType() may come from its name.
        $path = $file->getRealPath();
        $mimeType = strtolower((string) ($path !== false ? MimeTypes::getDefault()->guessMimeType($path) : $file->getMimeType()));

        return in_array($extension, self::EXTENSIONS, true)
            || in_array($mimeType, self::MIME_TYPES, true);
    }

    public static function mayShowInline(string $mimeType): bool
    {
        return in_array(strtolower($mimeType), self::INLINE_TYPES, true);
    }
}
