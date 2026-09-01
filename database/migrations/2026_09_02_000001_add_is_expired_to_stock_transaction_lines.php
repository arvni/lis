<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Lines are flagged when the operator has confirmed they are working with
     * expired stock — drawing it down, or booking expired goods back in.
     */
    public function up(): void
    {
        Schema::table('stock_transaction_lines', function (Blueprint $table) {
            $table->boolean('is_expired')->default(false)->after('expiry_date');
        });
    }

    public function down(): void
    {
        Schema::table('stock_transaction_lines', function (Blueprint $table) {
            $table->dropColumn('is_expired');
        });
    }
};
