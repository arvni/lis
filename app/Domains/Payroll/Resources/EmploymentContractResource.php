<?php

declare(strict_types=1);

namespace App\Domains\Payroll\Resources;

use App\Domains\Payroll\Models\ContractLeaveEntitlement;
use App\Domains\Payroll\Models\EmploymentContract;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin EmploymentContract
 */
class EmploymentContractResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user' => [
                'id' => $this->user_id,
                'name' => $this->user?->name,
                'attendance_number' => $this->user?->attendance_number,
            ],
            'position' => $this->position,
            'employment_type' => $this->employment_type->value,
            'employment_type_label' => $this->employment_type->label(),
            'base_salary' => $this->base_salary,
            'overtime_multiplier' => $this->overtime_multiplier,
            'start_date' => $this->start_date->format('Y-m-d'),
            'end_date' => $this->end_date?->format('Y-m-d'),
            'probation_end_date' => $this->probation_end_date?->format('Y-m-d'),
            'reference' => $this->reference,
            'notes' => $this->notes,
            // A contract with no end date is still running; one with an end date in the past is done.
            'is_current' => $this->coversDate(now()->startOfDay()),
            'entitlements' => $this->whenLoaded(
                'entitlements',
                fn () => $this->entitlements->map(fn (ContractLeaveEntitlement $row) => [
                    'id' => $row->id,
                    'leave_kind_id' => $row->leave_kind_id,
                    'leave_kind' => $row->kind?->name,
                    'is_paid' => $row->kind?->is_paid,
                    'entitled_days' => $row->entitled_days,
                ])->all(),
                [],
            ),
        ];
    }
}
