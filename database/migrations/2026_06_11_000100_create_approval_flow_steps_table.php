<?php

use App\Domains\Laboratory\Models\ApprovalFlow;
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
        Schema::create('approval_flow_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(ApprovalFlow::class)->constrained()->cascadeOnDelete();
            $table->unsignedInteger('position');
            $table->string('name');
            // Who may act on this step: a role, a specific user, or neither
            // (neither = anyone holding the "Report.Approve Report" permission).
            $table->foreignId('role_id')->nullable()->constrained('roles')->restrictOnDelete();
            $table->foreignIdFor(User::class)->nullable()->constrained()->restrictOnDelete();
            $table->boolean('allow_self_approval')->default(false);
            $table->timestamps();

            $table->unique(['approval_flow_id', 'position']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('approval_flow_steps');
    }
};
