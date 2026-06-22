<?php

namespace App\Domains\Inventory\Repositories;

use App\Domains\Inventory\Models\ItemBarcode;

class ItemBarcodeRepository
{
    /**
     * Item-level barcode record matching a scanned barcode, with the owning
     * item (default unit + unit conversions) eager-loaded.
     */
    public function findByBarcodeWithItem(string $barcode): ?ItemBarcode
    {
        return ItemBarcode::with(['item.defaultUnit', 'item.unitConversions.unit'])
            ->where('barcode', $barcode)
            ->first();
    }
}
