<?php

use App\Domains\Laboratory\Models\ReportTemplate;
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
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->longText('value')->nullable();
            $table->foreignIdFor(AcceptanceItem::class,)->constrained()->cascadeOnDelete();
            $table->foreignIdFor(User::class, 'reporter_id')->constrained();
            $table->foreignIdFor(User::class, 'approver_id')->nullable();
            $table->foreignIdFor(User::class, 'publisher_id')->nullable();
            $table->foreignIdFor(ReportTemplate::class)->nullable();
            $table->timestamp('reported_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('printed_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->boolean('status')->default(true);
            $table->longText('comment')->nullable();
            $table->longText('clinical_comment')->nullable();
            $table->timestamps();
            $table->foreign('approver_id')->references('id')->on('users')->restrictOnDelete();
            $table->foreign('publisher_id')->references('id')->on('users')->restrictOnDelete();
            $table->foreign('report_template_id')->references('id')->on('report_templates')->restrictOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
