<?php

namespace App\Http\Controllers\Inventory\Api;

use App\Domains\Inventory\Models\Item;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class ItemUnitsController extends Controller
{
    public function __invoke(Item $item): JsonResponse
    {
        $item->load(['defaultUnit', 'unitConversions.unit']);

        $units = collect([
            [
                'id'                 => $item->defaultUnit->id,
                'name'               => $item->defaultUnit->name,
                'abbreviation'       => $item->defaultUnit->abbreviation,
                'conversion_to_base' => 1,
                'is_base'            => true,
            ]
        ])->merge(
            $item->unitConversions->map(fn($c) => [
                'id'                 => $c->unit->id,
                'name'               => $c->unit->name,
                'abbreviation'       => $c->unit->abbreviation,
                'conversion_to_base' => $c->conversion_to_base,
                'is_base'            => false,
            ])
        );

        return response()->json($units);
    }
}
