<?php

declare(strict_types=1);

namespace App\Domains\Payroll\Resources;

use App\Domains\Payroll\Models\SalarySlip;
use App\Domains\Payroll\Models\SalarySlipLine;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin SalarySlip
 */
class SalarySlipResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'number' => $this->number,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'from' => $this->period_from->format('Y-m-d'),
            'to' => $this->period_to->format('Y-m-d'),
            'net' => $this->net,
            'notes' => $this->notes,
            'issued_at' => $this->issued_at?->toIso8601String(),
            'issued_by' => $this->whenLoaded('issuedBy', fn () => $this->issuedBy?->name),
            'person' => [
                'id' => $this->user_id,
                'name' => $this->user?->name,
                'attendance_number' => $this->user?->attendance_number,
            ],
            // Copied onto the slip when it was generated, so it goes on saying what it said even
            // after the contract or the attendance behind it changes.
            'contract' => [
                'id' => $this->employment_contract_id,
                'position' => $this->position,
                'employment_type_label' => $this->employmentTypeLabel(),
                'basic_salary' => $this->basic_salary,
                'working_day_minutes' => $this->working_day_minutes,
                // The contract is loaded only to date the slip; every figure the slip states is
                // its own snapshot, so a contract edited later cannot rewrite it.
                'start_date' => $this->whenLoaded('contract', fn () => $this->contract?->start_date->format('Y-m-d')),
                'end_date' => $this->whenLoaded('contract', fn () => $this->contract?->end_date?->format('Y-m-d')),
            ],
            'attendance' => [
                ...($this->attendance ?? []),
                'scheduled_minutes' => $this->scheduled_minutes,
            ],
            'leave_balance' => $this->leave_balance,
            'lines' => $this->whenLoaded(
                'lines',
                fn () => $this->lines->map(fn (SalarySlipLine $line) => [
                    'id' => $line->id,
                    'code' => $line->code,
                    'label' => $line->label,
                    'amount' => $line->amount,
                    'note' => $line->note,
                    'payroll_item_id' => $line->payroll_item_id,
                    'installment_number' => $line->installment_number,
                ])->all(),
                [],
            ),
        ];
    }
}
