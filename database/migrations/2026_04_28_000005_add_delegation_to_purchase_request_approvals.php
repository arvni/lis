<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_request_approvals', function (Blueprint $table) {
            // When set, this user can also act on the step (in addition to the original approver)
            $table->foreignId('delegated_to_user_id')
                ->nullable()
                ->after('acted_by_user_id')
                ->constrained('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('purchase_request_approvals', function (Blueprint $table) {
            $table->dropConstrainedForeignId('delegated_to_user_id');
        });
    }
};
