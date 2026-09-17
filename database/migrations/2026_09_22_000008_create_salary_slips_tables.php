<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Salary slips are now kept rather than worked out afresh on every view: an employee has to
        // be able to see the slip they were actually given, which means the figures have to be the
        // ones that were issued, not whatever the contract and attendance happen to say today.
        Schema::create('salary_slips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // Kept for reference only. The terms that mattered are snapshotted below, so deleting a
            // contract cannot change what an issued slip says.
            $table->foreignId('employment_contract_id')->nullable()->constrained()->nullOnDelete();

            $table->date('period_from');
            $table->date('period_to');
            $table->string('status', 10);
            // Given out when the slip is issued, so an employee has something to quote.
            $table->string('number', 30)->nullable()->unique();
            $table->decimal('net', 20, 3)->default(0);

            // Snapshots, taken when the slip is generated.
            $table->decimal('basic_salary', 20, 3)->default(0);
            $table->string('position', 150)->nullable();
            $table->string('employment_type', 20)->nullable();
            $table->unsignedInteger('scheduled_minutes')->default(0);
            $table->unsignedInteger('working_day_minutes')->nullable();
            $table->json('attendance')->nullable();
            $table->json('leave_balance')->nullable();

            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('issued_at')->nullable();
            $table->foreignId('issued_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            // One slip per person per month; a correction edits the slip rather than adding another.
            $table->unique(['user_id', 'period_from']);
            $table->index(['status', 'period_from']);
        });

        Schema::create('salary_slip_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('salary_slip_id')->constrained()->cascadeOnDelete();
            $table->string('code', 20);
            $table->string('label', 150);
            // Signed: a deduction is negative, so the net is simply the sum.
            $table->decimal('amount', 20, 3)->default(0);
            $table->string('note', 255)->nullable();

            // Which recurring item produced the line, and which instalment of it this was. The
            // number is recorded here rather than counted live so that editing an issued slip can
            // never renumber a loan behind everyone's back.
            $table->foreignId('payroll_item_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedSmallInteger('installment_number')->nullable();

            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['payroll_item_id', 'installment_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('salary_slip_lines');
        Schema::dropIfExists('salary_slips');
    }
};
