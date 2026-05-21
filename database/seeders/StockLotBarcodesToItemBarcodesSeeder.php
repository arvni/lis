<?php

namespace Database\Seeders;

use App\Domains\Inventory\Models\ItemBarcode;
use App\Domains\Inventory\Models\StockLot;
use Illuminate\Database\Seeder;

class StockLotBarcodesToItemBarcodesSeeder extends Seeder
{
    public function run(): void
    {
        $lots = StockLot::whereNotNull('barcode')->get(['item_id', 'barcode']);

        $inserted = 0;
        $skipped  = 0;

        foreach ($lots as $lot) {
            $created = ItemBarcode::firstOrCreate(
                ['item_id' => $lot->item_id, 'barcode' => $lot->barcode],
                ['label' => 'lot', 'is_primary' => false],
            );

            $created->wasRecentlyCreated ? $inserted++ : $skipped++;
        }

        $this->command->info("Done — {$inserted} inserted, {$skipped} already existed.");
    }
}
