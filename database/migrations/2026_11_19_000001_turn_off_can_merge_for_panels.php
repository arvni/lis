<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * "Merge on Invoice" now applies to panels too. It used to be ignored for them while
 * defaulting to on, so switch it off for every existing panel: invoices keep one line per
 * panel until someone turns it on for a panel on purpose.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('tests')->where('type', 'PANEL')->update(['can_merge' => false]);
    }

    public function down(): void
    {
        // Which panels had it on before is not recorded, and it was ignored for them anyway.
    }
};
