<?php

namespace App\Domains\Inventory\Services;

use App\Domains\Inventory\Models\Item;
use App\Domains\Inventory\Models\Unit;
use Illuminate\Support\Collection;

readonly class UnitConversionService
{
    /**
     * Convert quantity in given unit to base units.
     */
    public function toBaseUnits(int $itemId, int $unitId, float $quantity): float
    {
        $item = Item::with('defaultUnit', 'unitConversions.unit')->findOrFail($itemId);

        if ($unitId === $item->default_unit_id)
            return $quantity;

        $conversion = $item->unitConversions->firstWhere('unit_id', $unitId);
        if (!$conversion)
            throw new \InvalidArgumentException("No conversion found for unit {$unitId} on item {$itemId}");

        return $quantity * (float) $conversion->conversion_to_base;
    }

    /**
     * Break down base quantity into the largest units possible.
     * Returns array like: [['unit' => Unit, 'qty' => 1], ...]
     */
    public function fromBaseUnits(int $itemId, float $baseQty): array
    {
        $item = Item::with(['defaultUnit', 'unitConversions' => fn($q) => $q->with('unit')->orderByDesc('conversion_to_base')])->findOrFail($itemId);

        $breakdown = [];
        $remaining = $baseQty;

        foreach ($item->unitConversions as $conv) {
            $ratio = (float) $conv->conversion_to_base;
            if ($ratio <= 1) continue;
            $count = (int) floor($remaining / $ratio);
            if ($count > 0) {
                $breakdown[] = ['unit' => $conv->unit, 'qty' => $count];
                $remaining = fmod($remaining, $ratio);
            }
        }

        // Remaining in base unit
        if ($remaining > 0.0001) {
            $breakdown[] = ['unit' => $item->defaultUnit, 'qty' => round($remaining, 6)];
        }

        return $breakdown;
    }

    /**
     * Format stock as human-readable string, e.g. "1 Carton, 2 Box, 8 vials"
     */
    public function formatStock(int $itemId, float $baseQty): string
    {
        $parts = $this->fromBaseUnits($itemId, $baseQty);
        if (empty($parts)) return '0';

        return collect($parts)
            ->map(fn($p) => "{$p['qty']} {$p['unit']->name}")
            ->implode(', ');
    }
}
