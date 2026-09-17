<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // An allowance or deduction that applies to one person, month after month, on their salary
        // slip. Deliberately not tied to a contract: a loan is owed whether or not the contract it
        // started under has since been replaced.
        Schema::create('payroll_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // What it is called and whether it adds or takes away comes from the catalogue.
            $table->foreignId('payroll_item_type_id')->constrained()->restrictOnDelete();

            // How the monthly figure is worked out:
            //   FIXED        — `amount`, every month between the dates
            //   PERCENTAGE   — `percentage` of the contract's basic salary, between the dates
            //   INSTALLMENTS — `total_amount` split over `installments` months from start_date,
            //                  e.g. a loan; it ends when the instalments run out
            $table->string('calculation', 12);
            $table->decimal('amount', 20, 3)->nullable();
            $table->decimal('percentage', 6, 3)->nullable();
            $table->decimal('total_amount', 20, 3)->nullable();
            $table->unsignedSmallInteger('installments')->nullable();

            // The first month it applies to. Instalments are numbered from here, so this date is
            // what decides which one a given month is.
            $table->date('start_date');
            // Null while open-ended. Left empty for instalments, which end when they are paid off.
            $table->date('end_date')->nullable();

            $table->string('notes', 500)->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            // No unique on (user, type): the same person can hold two loans at different times.
            $table->index(['user_id', 'start_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_items');
    }
};
