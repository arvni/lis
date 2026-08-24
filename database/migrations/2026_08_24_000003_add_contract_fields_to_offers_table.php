<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('offers', function (Blueprint $table) {
            // Ceiling for what one acceptance may take from this offer. Null = uncapped.
            $table->decimal('max_amount_per_acceptance', 20, 3)->nullable()->after('amount');
        });
    }

    public function down(): void
    {
        Schema::table('offers', function (Blueprint $table) {
            $table->dropColumn('max_amount_per_acceptance');
        });
    }
};
