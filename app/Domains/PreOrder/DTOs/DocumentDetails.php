<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\DTOs;

/** The name and details an uploader gives a file. Both are plain text, never markup. */
final readonly class DocumentDetails
{
    public function __construct(
        public ?string $title = null,
        public ?string $description = null,
    ) {}

    /** @param  array<string, mixed>  $data */
    public static function fromArray(array $data): self
    {
        return new self(self::clean($data['title'] ?? null, 150), self::clean($data['description'] ?? null, 2000));
    }

    /** Trimmed and cut to length, without control characters (line breaks stay in details). */
    private static function clean(mixed $value, int $max): ?string
    {
        if (! is_string($value)) {
            return null;
        }
        $value = (string) preg_replace('/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]+/u', '', $value);
        $value = trim(mb_substr($value, 0, $max));

        return $value !== '' ? $value : null;
    }
}
