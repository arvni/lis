<?php

namespace App\Domains\Inventory\Services;

use App\Domains\Inventory\Models\Item;

readonly class ItemCodeService
{
    /**
     * Generate item_code from department + material_type.
     * Format: {DEPT}-{TYPE}-{XXXXXX}
     * Example: LAB-CHM-000001
     */
    public function generate(string $department, string $materialType): string
    {
        $prefix = "{$department}-{$materialType}-";

        $last = Item::withTrashed()
            ->where('item_code', 'like', $prefix . '%')
            ->orderByDesc('item_code')
            ->lockForUpdate()
            ->value('item_code');

        $next = $last ? ((int) substr($last, strlen($prefix))) + 1 : 1;

        return $prefix . str_pad($next, 6, '0', STR_PAD_LEFT);
    }
}
