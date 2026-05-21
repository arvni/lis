<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_lots', function (Blueprint $table) {
            // Drop unique constraint only if it exists (may already be absent on some environments)
            $indexes = collect(DB::select("SHOW INDEX FROM stock_lots WHERE Key_name = 'stock_lots_barcode_unique'"));
            if ($indexes->isNotEmpty()) {
                $table->dropUnique(['barcode']);
            }

            $plain = collect(DB::select("SHOW INDEX FROM stock_lots WHERE Key_name = 'stock_lots_barcode_index'"));
            if ($plain->isEmpty()) {
                $table->index('barcode');
            }
        });
    }

    public function down(): void
    {
        Schema::table('stock_lots', function (Blueprint $table) {
            $plain = collect(DB::select("SHOW INDEX FROM stock_lots WHERE Key_name = 'stock_lots_barcode_index'"));
            if ($plain->isNotEmpty()) {
                $table->dropIndex(['barcode']);
            }

            $unique = collect(DB::select("SHOW INDEX FROM stock_lots WHERE Key_name = 'stock_lots_barcode_unique'"));
            if ($unique->isEmpty()) {
                $table->unique('barcode');
            }
        });
    }
};
