<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** When the current stage was last reminded and escalated; cleared on every stage change. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pre_orders', function (Blueprint $table) {
            $table->timestamp('reminded_at')->nullable()->after('stage_entered_at');
            $table->timestamp('escalated_at')->nullable()->after('reminded_at');
        });
    }

    public function down(): void
    {
        Schema::table('pre_orders', function (Blueprint $table) {
            $table->dropColumn(['reminded_at', 'escalated_at']);
        });
    }
};
