<?php

declare(strict_types=1);

use Database\Seeders\PreOrderFlowSeeder;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The six built-in flows ship with the deploy, as version 1, so tests can be switched on for
 * pre-orders right away. The PreOrders.* permissions come from RoleAndPermissionSeeder, like
 * every other permission set.
 */
return new class extends Migration
{
    public function up(): void
    {
        (new PreOrderFlowSeeder)->run();
    }

    public function down(): void
    {
        DB::table('flows')->whereIn('family', ['nipt', 'carrier', 'exome', 'familial', 'pgt_a', 'pgt_m'])->where('version', 1)->delete();
    }
};
