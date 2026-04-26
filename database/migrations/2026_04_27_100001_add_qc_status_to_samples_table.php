<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('samples', function (Blueprint $table) {
            $table->enum('qc_status', ['pending', 'approved', 'rejected'])
                  ->default('approved');   // existing samples are treated as already approved
            $table->foreignId('qc_approved_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('qc_approved_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('samples', function (Blueprint $table) {
            $table->dropForeign(['qc_approved_by_id']);
            $table->dropColumn(['qc_status', 'qc_approved_by_id', 'qc_approved_at']);
        });
    }
};
