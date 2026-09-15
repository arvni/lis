<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // PO numbers are now assigned on approval, looked up (and locked) by year prefix.
        Schema::table('purchase_requests', function (Blueprint $table) {
            $table->index('po_number');
        });

        // Requests approved before numbering was automatic have no PO number yet (it used
        // to be typed in at "Issue PO"). Number them in approval order, continuing this
        // year's sequence the way PurchaseOrderNumberService does.
        $prefix = 'PO-'.now()->year.'-';
        $last = DB::table('purchase_requests')
            ->where('po_number', 'like', $prefix.'%')
            ->pluck('po_number')
            ->map(fn (string $number): string => substr($number, strlen($prefix)))
            ->filter(fn (string $suffix): bool => ctype_digit($suffix))
            ->map(fn (string $suffix): int => (int) $suffix)
            ->max() ?? 0;

        $unnumbered = DB::table('purchase_requests')
            ->where('status', 'APPROVED')
            ->whereNull('po_number')
            ->orderBy('updated_at')
            ->orderBy('id')
            ->pluck('id');

        foreach ($unnumbered as $id) {
            DB::table('purchase_requests')
                ->where('id', $id)
                ->update(['po_number' => $prefix.str_pad((string) ++$last, 4, '0', STR_PAD_LEFT)]);
        }
    }

    public function down(): void
    {
        // The assigned numbers stay: they may already be printed on purchase orders.
        Schema::table('purchase_requests', function (Blueprint $table) {
            $table->dropIndex(['po_number']);
        });
    }
};
