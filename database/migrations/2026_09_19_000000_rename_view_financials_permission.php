<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The permission that reveals prices, invoices and payments started life under
 * the Acceptances group, but it also governs the patient list and patient page,
 * so the name was misleading. Renaming the row in place keeps every role and
 * user grant attached to it; deleting and re-seeding would drop them.
 */
return new class extends Migration
{
    private const OLD = 'Reception.Acceptances.View Financials';

    private const NEW = 'Reception.Financials.View';

    public function up(): void
    {
        $this->rename(self::OLD, self::NEW);
    }

    public function down(): void
    {
        $this->rename(self::NEW, self::OLD);
    }

    /**
     * Rename, unless the target already exists — the seeder may have created it
     * first, and (name, guard_name) is unique.
     */
    private function rename(string $from, string $to): void
    {
        if (! DB::table('permissions')->where('name', $from)->exists()) {
            return;
        }

        if (DB::table('permissions')->where('name', $to)->exists()) {
            DB::table('permissions')->where('name', $from)->delete();

            return;
        }

        DB::table('permissions')->where('name', $from)->update(['name' => $to]);
    }
};
