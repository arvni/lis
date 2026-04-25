<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('monitoring_nodes', function (Blueprint $table) {
            $table->string('name')->nullable()->after('node_id');
            $table->string('model')->nullable()->after('name');
            $table->json('info')->nullable()->after('model');
            $table->boolean('onlined')->nullable()->after('info');
            $table->unsignedTinyInteger('signal_level')->nullable()->after('onlined');
            $table->unsignedTinyInteger('battery_level')->nullable()->after('signal_level');
        });
    }

    public function down(): void
    {
        Schema::table('monitoring_nodes', function (Blueprint $table) {
            $table->dropColumn(['name', 'model', 'info', 'onlined', 'signal_level', 'battery_level']);
        });
    }
};
