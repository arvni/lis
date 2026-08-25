<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Cards can now be minted as stock and printed before anyone knows which
        // partner they will go to, so the partner has to be optional on both.
        Schema::table('discount_card_batches', function (Blueprint $table) {
            $table->dropForeign(['discount_partner_id']);
        });
        Schema::table('discount_card_batches', function (Blueprint $table) {
            $table->unsignedBigInteger('discount_partner_id')->nullable()->change();
            $table->foreign('discount_partner_id')->references('id')->on('discount_partners')->restrictOnDelete();

            // The pattern this batch's numbers were minted from, kept for the audit
            // trail. Null on batches issued before templates existed.
            $table->string('number_template', 64)->nullable()->after('prefix');
            // Serials run serial_from .. serial_from + quantity - 1, so a batch can
            // continue where the last one stopped and ranges stay meaningful.
            $table->unsignedInteger('serial_from')->default(1)->after('quantity');
        });

        Schema::table('discount_cards', function (Blueprint $table) {
            $table->dropForeign(['discount_partner_id']);
        });
        Schema::table('discount_cards', function (Blueprint $table) {
            $table->unsignedBigInteger('discount_partner_id')->nullable()->change();
            $table->foreign('discount_partner_id')->references('id')->on('discount_partners')->restrictOnDelete();

            // When a stock card was handed to a partner, and by whom.
            $table->timestamp('assigned_at')->nullable()->after('issued_at');
            $table->foreignId('assigned_by')->nullable()->after('assigned_at')
                ->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('discount_cards', function (Blueprint $table) {
            $table->dropConstrainedForeignId('assigned_by');
            $table->dropColumn('assigned_at');
        });
        Schema::table('discount_card_batches', function (Blueprint $table) {
            $table->dropColumn(['number_template', 'serial_from']);
        });

        // Unassigned rows would violate the restored NOT NULL, so they go first.
        Schema::table('discount_cards', function (Blueprint $table) {
            $table->dropForeign(['discount_partner_id']);
        });
        Schema::table('discount_card_batches', function (Blueprint $table) {
            $table->dropForeign(['discount_partner_id']);
        });
        Schema::table('discount_card_batches', function (Blueprint $table) {
            $table->unsignedBigInteger('discount_partner_id')->nullable(false)->change();
            $table->foreign('discount_partner_id')->references('id')->on('discount_partners')->restrictOnDelete();
        });
        Schema::table('discount_cards', function (Blueprint $table) {
            $table->unsignedBigInteger('discount_partner_id')->nullable(false)->change();
            $table->foreign('discount_partner_id')->references('id')->on('discount_partners')->restrictOnDelete();
        });
    }
};
