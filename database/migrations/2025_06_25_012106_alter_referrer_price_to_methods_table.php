<?php

use App\Domains\Laboratory\Enums\MethodPriceType;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('methods', function (Blueprint $table) {
            $table->decimal("referrer_price", 10, 2)->after("price")->default(0.00);
            $table->renameColumn("requirements", "referrer_extra");
            $table->enum("referrer_price_type", MethodPriceType::values())->default(MethodPriceType::FIX->value)->after("price_type");
        });
        Artisan::call('db:seed', [
            '--class' => \Database\Seeders\MethodReferrerPriceSeeder::class,
            '--force' => true,
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('methods', function (Blueprint $table) {
            $table->renameColumn("referrer_extra", "requirements");
            $table->dropColumn("referrer_price");
            $table->dropColumn("referrer_price_type");
        });
    }
};
