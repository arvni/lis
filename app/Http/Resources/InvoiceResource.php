<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Domains\Billing\Models\Invoice */
class InvoiceResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $data = parent::toArray($request);

        $items = collect($this->invoiceItems ?? [])->map(function ($item) {
            $test = $item->test;
            return [
                "id"               => $item->id,
                "kind"             => $item->kind?->value,
                "title"            => $item->title,
                "code"             => $item->code,
                "description"      => $item->description,
                "qty"              => $item->qty,
                "unit_price"       => (float) $item->unit_price,
                "price"            => (float) $item->price,
                "discount"         => (float) $item->discount,
                "customParameters" => $item->customParameters,
                "test_id"          => $item->test_id,
                "acceptance_id"    => $item->acceptance_id,
                "panel_id"         => $item->panel_id,
                "locked"           => $item->isLocked(),
                "test"             => $test ? [
                    "id"        => $test->id,
                    "name"      => $test->name,
                    "fullName"  => $test->fullName,
                    "code"      => $test->code,
                    "type"      => $test->type?->value,
                    "can_merge" => (bool) $test->can_merge,
                ] : null,
            ];
        })->values()->toArray();

        $data["invoice_items"] = $items;

        return $data;
    }
}
