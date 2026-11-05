<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * The acceptance page's "Sync with provider" button needs its own permission. RoleAndPermissionSeeder
 * lists it too, but the seeder doesn't run on deploy, so it is created here. Admin holds every
 * permission, so it gets this one as well; other roles are granted it by hand.
 */
return new class extends Migration
{
    private const PERMISSION = 'Reception.Acceptances.Sync With Provider';

    public function up(): void
    {
        $permission = Permission::findOrCreate(self::PERMISSION, 'web');
        Role::query()->where('name', 'Admin')->where('guard_name', 'web')->first()?->givePermissionTo($permission);
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        Permission::query()->where('name', self::PERMISSION)->where('guard_name', 'web')->delete();
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
