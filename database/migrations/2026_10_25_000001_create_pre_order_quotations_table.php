<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The center's financial approval. A pre-order can have several: one for the tests BION
 * confirmed, and one per additional-test request. The lines are the pre_order_items rows
 * themselves, so there is no separate lines table.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pre_order_quotations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pre_order_id')->constrained()->cascadeOnDelete();
            // Set when the quotation belongs to an additional-test request.
            $table->foreignId('request_id')->nullable()->constrained('pre_order_requests')->nullOnDelete();
            // Q-YY-NNNN from the pre-order, then -2, -3… for each later quotation.
            $table->string('number', 32)->unique();
            // bion_added, scope, retest: why a quotation was needed at all.
            $table->json('reasons');
            // BION's short note to the center.
            $table->text('reason')->nullable();
            $table->string('status', 24);
            $table->decimal('subtotal', 12, 3);
            $table->decimal('discount', 12, 3)->default(0);
            $table->decimal('total', 12, 3);
            $table->decimal('approved_amount', 12, 3)->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            // The center user who decided, as named by the provider panel (no LIS user).
            $table->string('decided_by')->nullable();
            $table->timestamp('decided_at')->nullable();
            // The center's reason for rejecting, or a note with a partial approval.
            $table->text('note')->nullable();
            // The center's own reference, e.g. an internal purchase order number.
            $table->string('center_reference', 64)->nullable();
            $table->timestamps();

            $table->index(['status', 'expires_at']);
        });

        Schema::table('pre_order_items', function (Blueprint $table) {
            $table->foreignId('quotation_id')->nullable()->after('request_id')->constrained('pre_order_quotations')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('pre_order_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('quotation_id');
        });
        Schema::dropIfExists('pre_order_quotations');
    }
};
