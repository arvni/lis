<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_requests', function (Blueprint $table) {
            $table->foreignId('supplier_id')->nullable()->after('approved_by_user_id')->constrained()->nullOnDelete();
            $table->string('po_number')->nullable()->after('supplier_id');
            $table->string('po_file')->nullable()->after('po_number');
            $table->date('payment_date')->nullable()->after('po_file');
            $table->string('payment_reference')->nullable()->after('payment_date');
            $table->string('payment_file')->nullable()->after('payment_reference');
            $table->date('shipment_date')->nullable()->after('payment_file');
            $table->string('tracking_number')->nullable()->after('shipment_date');
            $table->date('expected_delivery_date')->nullable()->after('tracking_number');
            $table->string('currency', 10)->nullable()->after('expected_delivery_date');
        });
    }

    public function down(): void
    {
        Schema::table('purchase_requests', function (Blueprint $table) {
            $table->dropForeign(['supplier_id']);
            $table->dropColumn([
                'supplier_id', 'po_number', 'po_file',
                'payment_date', 'payment_reference', 'payment_file',
                'shipment_date', 'tracking_number', 'expected_delivery_date', 'currency',
            ]);
        });
    }
};
