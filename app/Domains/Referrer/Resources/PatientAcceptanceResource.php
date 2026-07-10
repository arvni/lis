<?php

namespace App\Domains\Referrer\Resources;

use App\Domains\Reception\Models\Acceptance;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Shapes a Reception acceptance (with its items) for the referrer patient-lookup endpoint.
 *
 * @mixin Acceptance
 */
class PatientAcceptanceResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'created_at' => $this->created_at?->format('Y-m-d H:i'),
            'status' => $this->status->value,
            'referenceCode' => $this->referenceCode,
            'acceptance_items' => $this->acceptanceItems->map(fn ($item) => [
                'id' => $item->id,
                'test_name' => $item->methodTest?->method?->test->name ?? 'Unknown',
                'method_name' => $item->methodTest?->method->name ?? 'Unknown',
                'barcode_group' => $item->methodTest?->method?->barcodeGroup->name ?? 'Default',
            ]),
        ];
    }
}
