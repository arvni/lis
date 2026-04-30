<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('acceptances', function (Blueprint $table) {
            $table->index('status');
        });

        Schema::table('reports', function (Blueprint $table) {
            $table->index('approved_at');
            $table->index('published_at');
        });

        Schema::table('samples', function (Blueprint $table) {
            $table->index('status');
        });

        Schema::table('referrer_orders', function (Blueprint $table) {
            $table->index('status');
        });

        Schema::table('acceptance_item_samples', function (Blueprint $table) {
            $table->index('active');
        });
    }

    public function down(): void
    {
        Schema::table('acceptances', function (Blueprint $table) {
            $table->dropIndex(['status']);
        });

        Schema::table('reports', function (Blueprint $table) {
            $table->dropIndex(['approved_at']);
            $table->dropIndex(['published_at']);
        });

        Schema::table('samples', function (Blueprint $table) {
            $table->dropIndex(['status']);
        });

        Schema::table('referrer_orders', function (Blueprint $table) {
            $table->dropIndex(['status']);
        });

        Schema::table('acceptance_item_samples', function (Blueprint $table) {
            $table->dropIndex(['active']);
        });
    }
};
