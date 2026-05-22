<?php

use App\Domains\Billing\Models\Invoice;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Reception\Models\Acceptance;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Invoice::class)->constrained()->cascadeOnDelete();
            $table->foreignIdFor(Acceptance::class)->nullable()->constrained()->nullOnDelete();
            $table->string('kind')->default('test');
            $table->foreignIdFor(Test::class)->nullable()->constrained()->nullOnDelete();
            $table->uuid('panel_id')->nullable();
            $table->string('title');
            $table->string('code')->nullable();
            $table->text('description')->nullable();
            $table->decimal('unit_price', 20, 3)->default(0);
            $table->unsignedInteger('qty')->default(1);
            $table->decimal('price', 20, 3)->default(0);
            $table->decimal('discount', 20, 3)->default(0);
            $table->json('customParameters')->nullable();
            $table->timestamp('locked_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['invoice_id', 'acceptance_id']);
            $table->index(['invoice_id', 'kind']);
            $table->index('panel_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_items');
    }
};
