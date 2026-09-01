<?php

declare(strict_types=1);

namespace App\Http\Controllers\Inventory;

use App\Domains\Inventory\DTOs\RelocateStockDTO;
use App\Domains\Inventory\Models\StockLot;
use App\Domains\Inventory\Models\StockTransaction;
use App\Domains\Inventory\Requests\RelocateStockLotRequest;
use App\Domains\Inventory\Services\StockRelocationService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use RuntimeException;

class RelocateStockLotController extends Controller
{
    public function __construct(private StockRelocationService $relocationService) {}

    public function __invoke(RelocateStockLotRequest $request, StockLot $lot): RedirectResponse
    {
        // Relocating never changes quantity, but it does move stock between
        // stores, so it sits behind the same clearance as approving one.
        $this->authorize('approve', StockTransaction::class);

        try {
            $moved = $this->relocationService->relocate(
                $lot,
                RelocateStockDTO::fromArray($request->validated()),
                (int) $request->user()->id,
            );
        } catch (RuntimeException $e) {
            return back()->with(['success' => false, 'status' => $e->getMessage()]);
        }

        $moved->loadMissing(['store', 'location']);
        $place = $moved->location?->label
            ? "{$moved->store?->name} · {$moved->location->label}"
            : (string) $moved->store?->name;

        return back()->with([
            'success' => true,
            'status' => "Lot {$lot->lot_number} relocated to {$place}.",
        ]);
    }
}
