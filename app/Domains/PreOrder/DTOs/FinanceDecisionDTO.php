<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\DTOs;

use App\Domains\PreOrder\Enums\FinanceDecision;

final readonly class FinanceDecisionDTO
{
    /** @param  list<int>  $itemIds  the lines kept on a partial approval */
    public function __construct(
        public string $quotation,
        public FinanceDecision $decision,
        public array $itemIds = [],
        public ?string $note = null,
        public ?string $centerReference = null,
    ) {}

    /** @param  array<string, mixed>  $data */
    public static function fromArray(array $data): self
    {
        return new self(
            quotation: (string) $data['quotation'],
            decision: FinanceDecision::from($data['decision']),
            itemIds: array_values(array_map('intval', $data['items'] ?? [])),
            note: $data['note'] ?? null,
            centerReference: $data['center_reference'] ?? null,
        );
    }
}
