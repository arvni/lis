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
        Schema::table('acceptances', function (Blueprint $table) {
            $table->boolean('financial_approved')->default(false)->after('status');
            $table->foreignId('financial_approved_by')->nullable()->constrained('users')->after('financial_approved');
            $table->timestamp('financial_approved_at')->nullable()->after('financial_approved_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('acceptances', function (Blueprint $table) {
            $table->dropForeign(['financial_approved_by']);
            $table->dropColumn(['financial_approved', 'financial_approved_by', 'financial_approved_at']);
        });
    }
};
