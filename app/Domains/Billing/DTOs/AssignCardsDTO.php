<?php

declare(strict_types=1);

namespace App\Domains\Billing\DTOs;

/**
 * Either a serial range within one batch, or an explicit list of cards — never both.
 * The request layer is what enforces that; this only carries the choice.
 */
class AssignCardsDTO
{
    /**
     * @param  list<int>  $card_ids
     */
    public function __construct(
        public int $discount_partner_id,
        public array $card_ids = [],
        public ?int $discount_card_batch_id = null,
        public ?int $serial_from = null,
        public ?int $serial_to = null,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            (int) ($data['discount_partner_id'] ?? 0),
            array_map('intval', $data['card_ids'] ?? []),
            isset($data['discount_card_batch_id']) ? (int) $data['discount_card_batch_id'] : null,
            isset($data['serial_from']) && $data['serial_from'] !== '' ? (int) $data['serial_from'] : null,
            isset($data['serial_to']) && $data['serial_to'] !== '' ? (int) $data['serial_to'] : null,
        );
    }
}
