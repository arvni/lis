<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('stock_lots', function (Blueprint $table) {
            $table->string('brand')->nullable()->after('lot_number');
        });

        Schema::table('stock_transaction_lines', function (Blueprint $table) {
            $table->string('brand')->nullable()->after('lot_number');
        });
    }

    public function down(): void
    {
        Schema::table('stock_lots', function (Blueprint $table) {
            $table->dropColumn('brand');
        });

        Schema::table('stock_transaction_lines', function (Blueprint $table) {
            $table->dropColumn('brand');
        });
    }
};
