<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Requests;

use App\Domains\Inventory\Repositories\StockLotRepository;
use App\Domains\Inventory\Services\UnitConversionService;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class StoreStockExportRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'store_id' => 'required|exists:stores,id',
            'destination' => 'required|string|max:255',
            'purpose' => 'nullable|string',
            'urgency' => 'required|in:LOW,NORMAL,HIGH,URGENT',
            'notes' => 'nullable|string',
            'lines' => 'required|array|min:1',
            'lines.*.item_id' => 'required|exists:items,id',
            'lines.*.unit_id' => 'required|exists:units,id',
            'lines.*.qty' => 'required|numeric|min:0.000001',
            'lines.*.notes' => 'nullable|string',
        ];
    }

    /**
     * Requested export quantity must not exceed the item's current available
     * stock in the selected source store. This is a soft guard at request time
     * (stock isn't reserved); the authoritative check runs again at fulfillment.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $storeId = $this->integer('store_id');
            $lines = $this->input('lines');
            if (! $storeId || ! is_array($lines)) {
                return; // base rules already flagged the missing/invalid input
            }

            $conversion = app(UnitConversionService::class);
            $stockLots = app(StockLotRepository::class);

            foreach ($lines as $index => $line) {
                $itemId = $line['item_id'] ?? null;
                $unitId = $line['unit_id'] ?? null;
                $qty = $line['qty'] ?? null;
                if (! $itemId || ! $unitId || ! is_numeric($qty)) {
                    continue; // per-line rules handle these
                }

                $neededBase = $conversion->toBaseUnits((int) $itemId, (int) $unitId, (float) $qty);
                $available = $stockLots->totalActiveBaseUnits((int) $itemId, $storeId);

                if ($neededBase > $available) {
                    $validator->errors()->add(
                        "lines.{$index}.qty",
                        "Requested quantity exceeds available stock in the selected store (available: {$available} base units)."
                    );
                }
            }
        });
    }
}
