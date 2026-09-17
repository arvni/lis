<?php

declare(strict_types=1);

namespace App\Domains\Payroll\DTOs;

use App\Domains\Payroll\Enums\EmploymentType;

final readonly class EmploymentContractDTO
{
    /**
     * @param  int|null  $shiftId  the shift to put the person on from the contract's start; not a
     *                             contract column, it is written to their shift assignment so the
     *                             hours a slip prices by are the hours attendance measured
     * @param  list<ContractEntitlementDTO>  $entitlements
     */
    public function __construct(
        public int $userId,
        public ?string $position,
        public EmploymentType $employmentType,
        public string $baseSalary,
        public string $overtimeMultiplier,
        public string $startDate,
        public ?string $endDate,
        public ?string $probationEndDate,
        public ?string $reference,
        public ?string $notes,
        public ?int $shiftId,
        public array $entitlements,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        /** @var list<array<string, mixed>> $entitlements */
        $entitlements = $data['entitlements'] ?? [];
        $shiftId = $data['shift_id'] ?? null;

        return new self(
            (int) $data['user_id'],
            self::nullableString($data['position'] ?? null),
            EmploymentType::from((string) $data['employment_type']),
            (string) $data['base_salary'],
            (string) ($data['overtime_multiplier'] ?? '1.25'),
            (string) $data['start_date'],
            self::nullableString($data['end_date'] ?? null),
            self::nullableString($data['probation_end_date'] ?? null),
            self::nullableString($data['reference'] ?? null),
            self::nullableString($data['notes'] ?? null),
            $shiftId === null || $shiftId === '' ? null : (int) $shiftId,
            array_map(ContractEntitlementDTO::fromArray(...), array_values($entitlements)),
        );
    }

    /**
     * The contract's own columns. The shift and entitlement rows are written separately.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'user_id' => $this->userId,
            'position' => $this->position,
            'employment_type' => $this->employmentType->value,
            'base_salary' => $this->baseSalary,
            'overtime_multiplier' => $this->overtimeMultiplier,
            'start_date' => $this->startDate,
            'end_date' => $this->endDate,
            'probation_end_date' => $this->probationEndDate,
            'reference' => $this->reference,
            'notes' => $this->notes,
        ];
    }

    private static function nullableString(mixed $value): ?string
    {
        return $value === null || $value === '' ? null : (string) $value;
    }
}
