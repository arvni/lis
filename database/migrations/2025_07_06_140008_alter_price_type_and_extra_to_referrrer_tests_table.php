<?php

use App\Domains\Laboratory\Enums\MethodPriceType;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('referrer_tests', function (Blueprint $table) {
            $table->enum('price_type', MethodPriceType::values())->default(MethodPriceType::FIX)->after('test_id');
            $table->json("extra")->nullable()->after('price');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('referrer_tests', function (Blueprint $table) {
            $table->dropColumn('price_type');
            $table->dropColumn('extra');
        });
    }
};
