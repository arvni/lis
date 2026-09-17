<?php

declare(strict_types=1);

namespace App\Domains\Payroll\Resources;

use App\Domains\Payroll\Models\PayrollItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin PayrollItem
 */
class PayrollItemResource extends JsonResource
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
            ],
            'payroll_item_type_id' => $this->payroll_item_type_id,
            'type' => $this->type?->name,
            'kind' => $this->type?->kind->value,
            'kind_label' => $this->type?->kind->label(),
            'calculation' => $this->calculation->value,
            'calculation_label' => $this->calculation->label(),
            'amount' => $this->amount,
            'percentage' => $this->percentage,
            'total_amount' => $this->total_amount,
            'installments' => $this->installments,
            'start_date' => $this->start_date->format('Y-m-d'),
            'end_date' => $this->end_date?->format('Y-m-d'),
            'notes' => $this->notes,
            'sort_order' => $this->sort_order,
        ];
    }
}
