<?php

use App\Domains\Laboratory\Models\Section;
use App\Domains\Reception\Enums\AcceptanceItemStateStatus;
use App\Domains\Reception\Models\AcceptanceItem;
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
        Schema::create('acceptance_item_states', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(AcceptanceItem::class)->constrained()->cascadeOnDelete();
            $table->foreignIdFor(Section::class )->constrained()->restrictOnDelete();
            $table->foreignIdFor(User::class);
            $table->foreignIdFor(User::class, 'started_by_id')->nullable();
            $table->foreignIdFor(User::class, 'finished_by_id')->nullable();
            $table->longText('parameters');
            $table->enum('status', AcceptanceItemStateStatus::values())->default(AcceptanceItemStateStatus::WAITING);
            $table->longText('details')->nullable();
            $table->boolean('is_first_section')->default(false);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->integer('order')->nullable();
            $table->timestamps();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('restrict');
            $table->foreign('finished_by_id')->references('id')->on('users')->onDelete('restrict');
            $table->foreign('started_by_id')->references('id')->on('users')->onDelete('restrict');

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('acceptance_item_states');
    }
};
