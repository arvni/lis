<?php

declare(strict_types=1);

use App\Domains\Shared\Helpers\AmountDistributor;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Repair acceptance items whose discount sits above their own price.
     *
     * A panel's price was split in whole units while its discount was split in
     * thousandths, so a panel that did not divide evenly could leave an item
     * priced 3 carrying a 3.334 discount. Both columns are unsigned, which makes
     * MySQL abort any `price - discount` aggregate over such a row with
     * "1690 DECIMAL UNSIGNED value is out of range" instead of returning a
     * negative — one row was enough to 500 the dashboard.
     *
     * The panel keeps the exact discount it was given; only the split between its
     * items moves, so invoices and statements built on panel totals stay correct
     * and need no recompose.
     */
    public function up(): void
    {
        $panelIds = DB::table('acceptance_items')
            ->whereNull('deleted_at')
            ->whereNotNull('panel_id')
            ->whereColumn('discount', '>', 'price')
            ->distinct()
            ->pluck('panel_id');

        foreach ($panelIds as $panelId) {
            $items = DB::table('acceptance_items')
                ->whereNull('deleted_at')
                ->where('panel_id', $panelId)
                ->orderBy('id')
                ->get(['id', 'price', 'discount']);

            $shares = AmountDistributor::distributeCapped(
                (float) $items->sum(static fn ($item): float => (float) $item->discount),
                $items->map(static fn ($item): float => (float) $item->price)->all(),
                AmountDistributor::DISCOUNT_DECIMALS
            );

            foreach ($items->values() as $index => $item) {
                if ((float) $item->discount === $shares[$index]) {
                    continue;
                }

                DB::table('acceptance_items')
                    ->where('id', $item->id)
                    ->update(['discount' => $shares[$index]]);
            }
        }

        // Whatever is left has no sibling to hand the excess to — a standalone
        // item, or a soft-deleted row a panel pass skipped. Capping is all that is
        // available, and a discount was never allowed past the price anyway.
        DB::table('acceptance_items')
            ->whereColumn('discount', '>', 'price')
            ->update(['discount' => DB::raw('price')]);
    }

    public function down(): void
    {
        // Nothing to restore: the amounts this corrected were never valid.
    }
};
