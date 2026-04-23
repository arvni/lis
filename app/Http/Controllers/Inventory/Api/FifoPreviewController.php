<?php

namespace App\Http\Controllers\Inventory\Api;

use App\Domains\Inventory\Repositories\StockLotRepository;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FifoPreviewController extends Controller
{
    public function __construct(private StockLotRepository $lotRepository) {}

    public function __invoke(Request $request): JsonResponse
    {
        $itemId  = $request->integer('item_id');
        $storeId = $request->integer('store_id');
        $needed  = (float) $request->input('quantity_base_units', 0);

        if (!$itemId || !$storeId || $needed <= 0) {
            return response()->json(['lots' => [], 'available' => 0, 'shortfall' => 0]);
        }

        $lots      = $this->lotRepository->activeFifoLots($itemId, $storeId);
        $available = (float) $lots->sum('quantity_base_units');
        $remaining = $needed;
        $breakdown = [];

        foreach ($lots as $lot) {
            if ($remaining <= 0) break;
            $take = min((float) $lot->quantity_base_units, $remaining);
            $breakdown[] = [
                'lot_number'          => $lot->lot_number,
                'brand'               => $lot->brand,
                'expiry_date'         => $lot->expiry_date?->format('Y-m-d'),
                'quantity_base_units' => (float) $lot->quantity_base_units,
                'take'                => $take,
                'remaining_after'     => round((float) $lot->quantity_base_units - $take, 6),
            ];
            $remaining -= $take;
        }

        return response()->json([
            'lots'      => $breakdown,
            'available' => $available,
            'needed'    => $needed,
            'shortfall' => max(0, $needed - $available),
        ]);
    }
}
