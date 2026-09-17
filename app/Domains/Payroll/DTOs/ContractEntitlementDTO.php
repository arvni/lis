<?php

declare(strict_types=1);

namespace App\Domains\Payroll\DTOs;

/**
 * One leave kind's allowance on a contract, in whole days for the contract's whole duration.
 */
final readonly class ContractEntitlementDTO
{
    public function __construct(
        public int $leaveKindId,
        public string $entitledDays,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self((int) $data['leave_kind_id'], (string) $data['entitled_days']);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'leave_kind_id' => $this->leaveKindId,
            'entitled_days' => $this->entitledDays,
        ];
    }
}
