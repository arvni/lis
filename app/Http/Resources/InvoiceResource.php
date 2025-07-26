<?php

namespace App\Http\Resources;

use App\Domains\Laboratory\Enums\TestType;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Arr;

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
        $data["acceptance_items"] = collect($data["acceptance_items"])->groupBy(function ($item) {
            // Accessing nested properties. Ensure 'method_test' and 'test' are loaded if $item is a model,
            // or that the array structure is as expected.
            return $item['method_test']['test']['type'] instanceof TestType
                ? $item['method_test']['test']['type']->value
                : $item['method_test']['test']['type'];
        })
            ->toArray();
        if (count($data["acceptance_items"]["PANEL"] ?? [])) {
            $data["acceptance_items"]["PANEL"] = array_values(collect($data["acceptance_items"]["PANEL"])
                ->groupBy("panel_id")
                ->map(function ($item) {
                    $itemCollect = collect($item);
                    $firstItem = $itemCollect->first();
                    $newItem["method_test"] = $firstItem["method_test"];
                    $newItem["id"] = $firstItem["panel_id"];
                    $newItem["price"] = $itemCollect->reduce(fn($a, $b) => $a + $b["price"], 0);
                    $newItem["discount"] = $itemCollect->reduce(fn($a, $b) => $a + $b["discount"], 0);
                    $newItem["acceptance_items"] = $item;
                    return $newItem;
                })->toArray());
        }
        return $data;
    }
}
