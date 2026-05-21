<?php

namespace App\Http\Controllers\Inventory\Api;

use App\Domains\Inventory\Models\ItemBarcode;
use App\Domains\Inventory\Models\StockLot;
use App\Domains\Inventory\Models\StockTransactionLine;
use App\Domains\Inventory\Requests\BarcodeScanRequest;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class BarcodeScanController extends Controller
{
    public function __invoke(BarcodeScanRequest $request): JsonResponse
    {
        $barcode = $request->input('barcode');

        // 1. Item-level barcode table (one item → many barcodes)
        $itemBarcode = ItemBarcode::with(['item.defaultUnit', 'item.unitConversions.unit'])
            ->where('barcode', $barcode)
            ->first();

        if ($itemBarcode) {
            $item = $itemBarcode->item;
            $lots = $this->activeLotsForItem($item->id);

            return response()->json([
                'found'   => true,
                'source'  => 'item_barcode',
                'item'    => $item,
                'unit'    => $item->defaultUnit,
                'lots'    => $lots,
                'barcode' => $barcode,
            ]);
        }

        // 2. Lot-level barcode (one barcode → possibly many lots)
        $lots = StockLot::with(['item.defaultUnit', 'item.unitConversions.unit'])
            ->where('barcode', $barcode)
            ->where('status', 'ACTIVE')
            ->where('quantity_base_units', '>', 0)
            ->orderBy('received_date')
            ->get();

        if ($lots->isNotEmpty()) {
            $item = $lots->first()->item;

            return response()->json([
                'found'   => true,
                'source'  => 'lot',
                'item'    => $item,
                'unit'    => $item->defaultUnit,
                'lots'    => $lots->map(fn($l) => $this->lotShape($l))->values(),
                'barcode' => $barcode,
            ]);
        }

        // 3. History fallback — item identification only, no active lots
        $line = StockTransactionLine::with(['item.defaultUnit', 'item.unitConversions.unit', 'unit'])
            ->where('barcode', $barcode)
            ->latest()
            ->first();

        if ($line) {
            return response()->json([
                'found'   => true,
                'source'  => 'history',
                'item'    => $line->item,
                'unit'    => $line->unit,
                'lots'    => [],
                'barcode' => $barcode,
            ]);
        }

        return response()->json(['found' => false, 'barcode' => $barcode]);
    }

    private function activeLotsForItem(int $itemId): array
    {
        return StockLot::where('item_id', $itemId)
            ->where('status', 'ACTIVE')
            ->where('quantity_base_units', '>', 0)
            ->orderBy('received_date')
            ->get(['id', 'lot_number', 'brand', 'expiry_date', 'quantity_base_units'])
            ->map(fn($l) => $this->lotShape($l))
            ->values()
            ->toArray();
    }

    private function lotShape(StockLot $lot): array
    {
        return [
            'id'                  => $lot->id,
            'lot_number'          => $lot->lot_number,
            'brand'               => $lot->brand,
            'expiry_date'         => $lot->expiry_date?->format('Y-m-d'),
            'quantity_base_units' => $lot->quantity_base_units,
        ];
    }
}
