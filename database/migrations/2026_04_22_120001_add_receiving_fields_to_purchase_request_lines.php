<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_request_lines', function (Blueprint $table) {
            $table->string('cat_no')->nullable()->after('notes');
            $table->decimal('unit_price', 15, 4)->nullable()->after('cat_no');
            $table->decimal('qty_received', 15, 6)->default(0)->after('unit_price');
        });
    }

    public function down(): void
    {
        Schema::table('purchase_request_lines', function (Blueprint $table) {
            $table->dropColumn(['cat_no', 'unit_price', 'qty_received']);
        });
    }
};
