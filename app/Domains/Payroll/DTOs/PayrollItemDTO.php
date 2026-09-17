<?php

declare(strict_types=1);

namespace App\Domains\Payroll\DTOs;

use App\Domains\Payroll\Enums\PayrollCalculation;

/**
 * One person's recurring allowance or deduction, as submitted.
 *
 * Only the fields its calculation uses are kept; the rest are stored as null so a figure left over
 * from a different shape can never be read back by mistake.
 */
final readonly class PayrollItemDTO
{
    public function __construct(
        public int $userId,
        public int $payrollItemTypeId,
        public PayrollCalculation $calculation,
        public ?string $amount,
        public ?string $percentage,
        public ?string $totalAmount,
        public ?int $installments,
        public string $startDate,
        public ?string $endDate,
        public ?string $notes,
        public int $sortOrder,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        $calculation = PayrollCalculation::from((string) $data['calculation']);
        $fixed = $calculation === PayrollCalculation::FIXED;
        $percentage = $calculation === PayrollCalculation::PERCENTAGE;
        $installments = $calculation === PayrollCalculation::INSTALLMENTS;

        return new self(
            (int) $data['user_id'],
            (int) $data['payroll_item_type_id'],
            $calculation,
            $fixed ? self::nullableString($data['amount'] ?? null) : null,
            $percentage ? self::nullableString($data['percentage'] ?? null) : null,
            $installments ? self::nullableString($data['total_amount'] ?? null) : null,
            $installments ? (int) $data['installments'] : null,
            (string) $data['start_date'],
            // Instalments end when they are paid off, so an end date would only contradict them.
            $calculation->usesEndDate() ? self::nullableString($data['end_date'] ?? null) : null,
            self::nullableString($data['notes'] ?? null),
            (int) ($data['sort_order'] ?? 0),
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'user_id' => $this->userId,
            'payroll_item_type_id' => $this->payrollItemTypeId,
            'calculation' => $this->calculation->value,
            'amount' => $this->amount,
            'percentage' => $this->percentage,
            'total_amount' => $this->totalAmount,
            'installments' => $this->installments,
            'start_date' => $this->startDate,
            'end_date' => $this->endDate,
            'notes' => $this->notes,
            'sort_order' => $this->sortOrder,
        ];
    }

    private static function nullableString(mixed $value): ?string
    {
        return $value === null || $value === '' ? null : (string) $value;
    }
}
