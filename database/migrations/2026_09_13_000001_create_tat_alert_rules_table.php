<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tat_alert_rules', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            // Remind while an item has this many working days of TAT left or fewer (overdue included).
            $table->unsignedSmallInteger('days_left');
            $table->boolean('active')->default(true);
            // The daily job skips a rule it already ran today, so a re-run cannot double-notify.
            $table->date('last_run_on')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tat_alert_rules');
    }
};
