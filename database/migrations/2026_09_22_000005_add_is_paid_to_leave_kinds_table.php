<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leave_kinds', function (Blueprint $table) {
            // Whether time off of this kind is still paid. The salary slip deducts unpaid leave,
            // and without this there is no way to tell one from the other. Existing kinds stay
            // paid, which is what they were assumed to be before.
            $table->boolean('is_paid')->default(true)->after('name');
        });
    }

    public function down(): void
    {
        Schema::table('leave_kinds', function (Blueprint $table) {
            $table->dropColumn('is_paid');
        });
    }
};
