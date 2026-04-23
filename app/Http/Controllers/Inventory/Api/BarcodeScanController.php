<?php

namespace App\Http\Controllers\Inventory\Api;

use App\Domains\Inventory\Models\StockLot;
use App\Domains\Inventory\Models\StockTransactionLine;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BarcodeScanController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $request->validate(['barcode' => 'required|string']);
        $barcode = $request->input('barcode');

        // 1. Look for an active lot with this barcode
        $lot = StockLot::with(['item.defaultUnit', 'item.unitConversions.unit'])
            ->where('barcode', $barcode)
            ->where('status', 'ACTIVE')
            ->where('quantity_base_units', '>', 0)
            ->first();

        if ($lot) {
            return response()->json([
                'found'       => true,
                'source'      => 'lot',
                'item'        => $lot->item,
                'unit'        => $lot->item->defaultUnit,
                'lot_number'  => $lot->lot_number,
                'brand'       => $lot->brand,
                'expiry_date' => $lot->expiry_date?->format('Y-m-d'),
                'barcode'     => $lot->barcode,
            ]);
        }

        // 2. Look in any previous transaction line with this barcode
        $line = StockTransactionLine::with(['item.defaultUnit', 'item.unitConversions.unit', 'unit'])
            ->where('barcode', $barcode)
            ->latest()
            ->first();

        if ($line) {
            return response()->json([
                'found'       => true,
                'source'      => 'history',
                'item'        => $line->item,
                'unit'        => $line->unit,
                'lot_number'  => $line->lot_number,
                'brand'       => $line->brand,
                'expiry_date' => $line->expiry_date?->format('Y-m-d'),
                'barcode'     => $line->barcode,
            ]);
        }

        // 3. Not found — barcode is new
        return response()->json(['found' => false, 'barcode' => $barcode]);
    }
}
