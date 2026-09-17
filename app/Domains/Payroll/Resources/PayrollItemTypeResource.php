<?php

declare(strict_types=1);

namespace App\Domains\Payroll\Resources;

use App\Domains\Payroll\Models\PayrollItemType;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin PayrollItemType
 */
class PayrollItemTypeResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'kind' => $this->kind->value,
            'kind_label' => $this->kind->label(),
            'default_amount' => $this->default_amount,
            'is_active' => $this->is_active,
        ];
    }
}
