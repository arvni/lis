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
        Schema::table('stock_transactions', function (Blueprint $table) {
            $table->timestamp('transfer_received_at')->nullable()->after('total_value');
            $table->foreignId('transfer_received_by_user_id')->nullable()->constrained('users')->nullOnDelete()->after('transfer_received_at');
        });
    }

    public function down(): void
    {
        Schema::table('stock_transactions', function (Blueprint $table) {
            $table->dropForeign(['transfer_received_by_user_id']);
            $table->dropColumn(['transfer_received_at', 'transfer_received_by_user_id']);
        });
    }
};
