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
        Schema::table('tests', function (Blueprint $table) {
            $table->enum("price_type", MethodPriceType::values())->default(MethodPriceType::FIX)->after("status");
            $table->json("extra")->nullable()->after("price");
            $table->enum("referrer_price_type", MethodPriceType::values())->default(MethodPriceType::FIX)->after("extra");
            $table->json("referrer_extra")
                ->nullable()
                ->after("referrer_price");
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tests', function (Blueprint $table) {
            $table->dropColumn("price_type");
            $table->dropColumn("referrer_price_type");
            $table->dropColumn("referrer_extra");
            $table->dropColumn("extra");
        });
    }
};
