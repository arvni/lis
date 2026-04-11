<?php

namespace Database\Seeders;

use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Reception\Models\AcceptanceItem;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MarkServiceAcceptanceItemsSeeder extends Seeder
{
    /**
     * Mark all acceptance items whose test type is SERVICE
     * as sampleless, reportless, and no_sample = 0.
     */
    public function run(): void
    {
        $items = AcceptanceItem::query()
            ->whereHas('test', fn($q) => $q->where('type', TestType::SERVICE))
            ->where(function ($q) {
                $q->where('sampleless', false)
                  ->orWhere('reportless', false)
                  ->orWhere('no_sample', '!=', 0);
            })
            ->get();

        $this->command->info("Found {$items->count()} SERVICE acceptance items to update.");

        DB::transaction(function () use ($items) {
            foreach ($items as $item) {
                $item->update([
                    'sampleless' => true,
                    'reportless' => true,
                    'no_sample'  => 0,
                ]);
            }
        });

        $this->command->info("Done.");
    }
}
