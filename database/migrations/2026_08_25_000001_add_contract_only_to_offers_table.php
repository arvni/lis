<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('offers', function (Blueprint $table) {
            // Contract offers are redeemed by presenting a partner card. Reception's
            // normal "offers on this test" lookup skips them, so a walk-in never gets
            // a partner's discount for free.
            $table->boolean('contract_only')->default(false)->after('active');
        });

        // Anything a partner already points at was a contract discount all along —
        // it just had no way to say so. Flag those before the new filter goes live.
        DB::table('offers')
            ->whereIn('id', DB::table('discount_partner_offer')->select('offer_id'))
            ->update(['contract_only' => true]);
    }

    public function down(): void
    {
        Schema::table('offers', function (Blueprint $table) {
            $table->dropColumn('contract_only');
        });
    }
};
