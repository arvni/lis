<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tat_alert_rule_test', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tat_alert_rule_id')->constrained('tat_alert_rules')->cascadeOnDelete();
            $table->foreignId('test_id')->constrained('tests')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['tat_alert_rule_id', 'test_id'], 'tat_alert_rule_test_unique');
        });

        Schema::create('tat_alert_rule_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tat_alert_rule_id')->constrained('tat_alert_rules')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['tat_alert_rule_id', 'user_id'], 'tat_alert_rule_user_unique');
        });

        Schema::create('tat_alert_rule_role', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tat_alert_rule_id')->constrained('tat_alert_rules')->cascadeOnDelete();
            $table->foreignId('role_id')->constrained('roles')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['tat_alert_rule_id', 'role_id'], 'tat_alert_rule_role_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tat_alert_rule_role');
        Schema::dropIfExists('tat_alert_rule_user');
        Schema::dropIfExists('tat_alert_rule_test');
    }
};
