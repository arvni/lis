<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Support;

/** A file that passed UploadInspector: a clean copy in a temp file, with its real type. */
final readonly class InspectedUpload
{
    public function __construct(
        public string $path,
        public string $extension,
        public string $mimeType,
    ) {}

    public function discard(): void
    {
        if (is_file($this->path)) {
            @unlink($this->path);
        }
    }
}
