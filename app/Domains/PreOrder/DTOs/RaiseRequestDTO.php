<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\DTOs;

use App\Domains\PreOrder\Enums\RequestType;
use Illuminate\Support\Carbon;

final readonly class RaiseRequestDTO
{
    /**
     * @param  list<RequestType>  $types
     * @param  array<string, mixed>|null  $needs
     */
    public function __construct(
        public array $types,
        public string $reason,
        public string $message,
        public bool $blocking = false,
        public ?array $needs = null,
        public ?Carbon $dueAt = null,
    ) {}

    /** @param  array<string, mixed>  $data */
    public static function fromArray(array $data): self
    {
        return new self(
            types: array_map(fn (string $t) => RequestType::from($t), array_values($data['types'])),
            reason: $data['reason'],
            message: $data['message'],
            blocking: (bool) ($data['blocking'] ?? false),
            needs: $data['needs'] ?? null,
            dueAt: isset($data['due_at']) ? Carbon::parse($data['due_at']) : null,
        );
    }
}
