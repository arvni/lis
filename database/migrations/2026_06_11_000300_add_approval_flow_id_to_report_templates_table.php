<?php

use App\Domains\Laboratory\Models\ApprovalFlow;
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
        Schema::table('report_templates', function (Blueprint $table) {
            // Null = default single-approval behavior.
            $table->foreignIdFor(ApprovalFlow::class)->nullable()->after('name')->constrained()->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('report_templates', function (Blueprint $table) {
            $table->dropConstrainedForeignIdFor(ApprovalFlow::class);
        });
    }
};
