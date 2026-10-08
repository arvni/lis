<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\PermissionRegistrar;

/**
 * Attendance, leave and payroll moved to the separate HR app (../hr), which has its own database,
 * users and roles. Their tables stay in this database untouched; only what would now break LIS goes:
 *
 *  - Leave workflow templates (request_type LEAVE). LIS no longer knows that type, so loading one
 *    would fail. Their steps go with them (cascade). Leave workflows are set up again in HR.
 *  - The Attendance.* and Payroll.* permissions, so the role editor stops offering them.
 *    Role and user assignments of them go with them (cascade).
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('workflow_templates')->where('request_type', 'LEAVE')->delete();

        DB::table('permissions')
            ->where(fn ($query) => $query
                ->where('name', 'Attendance')
                ->orWhere('name', 'like', 'Attendance.%')
                ->orWhere('name', 'Payroll')
                ->orWhere('name', 'like', 'Payroll.%'))
            ->delete();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        // Deleted rows are not restored; the features they belonged to live in the HR app now.
    }
};
