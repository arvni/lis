<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // What someone is employed on: their pay, the period it covers and the terms the salary
        // slip is built from. A person's contracts never overlap; ending one early means setting
        // its end_date rather than deleting it, so past slips still explain themselves.
        Schema::create('employment_contracts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // The authoritative, dated job title. users.title stays the free-text caption printed
            // under signatures.
            $table->string('position', 150)->nullable();
            $table->string('employment_type', 20);
            $table->decimal('base_salary', 20, 3);
            // How long a working day is, and so what an hour of overtime is worth, comes from the
            // shift the person is assigned — never from a figure typed here, which could disagree
            // with the hours their attendance was actually judged against. The multiplier stays: it
            // is a pay policy (125%), not an hours figure.
            $table->decimal('overtime_multiplier', 4, 2)->default(1.25);
            $table->date('start_date');
            // Null while the contract is open-ended.
            $table->date('end_date')->nullable();
            $table->date('probation_end_date')->nullable();
            // The paper contract this one records, if there is one.
            $table->string('reference', 100)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'start_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employment_contracts');
    }
};
