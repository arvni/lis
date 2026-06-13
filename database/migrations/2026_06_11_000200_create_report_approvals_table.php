<?php

use App\Domains\Laboratory\Models\ApprovalFlowStep;
use App\Domains\Reception\Models\Report;
use App\Domains\User\Models\User;
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
        Schema::create('report_approvals', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Report::class)->constrained()->cascadeOnDelete();
            // Nullable: legacy single-step approvals have no step reference,
            // and a deleted step must not erase the audit trail.
            $table->foreignIdFor(ApprovalFlowStep::class)->nullable()->constrained()->nullOnDelete();
            $table->foreignIdFor(User::class)->constrained()->restrictOnDelete();
            $table->string('action');
            $table->longText('comment')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('report_approvals');
    }
};
