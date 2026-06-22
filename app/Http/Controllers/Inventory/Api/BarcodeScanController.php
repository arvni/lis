<?php

namespace App\Http\Controllers\Inventory\Api;

use App\Domains\Inventory\Models\StockLot;
use App\Domains\Inventory\Repositories\ItemBarcodeRepository;
use App\Domains\Inventory\Repositories\StockLotRepository;
use App\Domains\Inventory\Repositories\StockTransactionRepository;
use App\Domains\Inventory\Requests\BarcodeScanRequest;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class BarcodeScanController extends Controller
{
    public function __construct(
        private ItemBarcodeRepository $itemBarcodes,
        private StockLotRepository $stockLots,
        private StockTransactionRepository $transactions,
    ) {}

    public function __invoke(BarcodeScanRequest $request): JsonResponse
    {
        $barcode = $request->input('barcode');

        // 1. Item-level barcode table (one item → many barcodes)
        $itemBarcode = $this->itemBarcodes->findByBarcodeWithItem($barcode);

        if ($itemBarcode) {
            $item = $itemBarcode->item;
            $lots = $this->stockLots->activeLotsForItem($item->id)
                ->map(fn (StockLot $l) => $this->lotShape($l))
                ->values();

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
        $lots = $this->stockLots->activeLotsByBarcode($barcode);

        if ($lots->isNotEmpty()) {
            $item = $lots->first()->item;

            return response()->json([
                'found'   => true,
                'source'  => 'lot',
                'item'    => $item,
                'unit'    => $item->defaultUnit,
                'lots'    => $lots->map(fn ($l) => $this->lotShape($l))->values(),
                'barcode' => $barcode,
            ]);
        }

        // 3. History fallback — item identification only, no active lots
        $line = $this->transactions->latestLineByBarcode($barcode);

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
