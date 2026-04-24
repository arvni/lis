<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class MonitoringPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            "Monitoring.Nodes.List Nodes",
            "Monitoring.Nodes.View Node",
            "Monitoring.Nodes.Update Node",
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        // Also ensure the parent permission nodes exist (used by nav visibility checks)
        foreach (["Monitoring", "Monitoring.Nodes"] as $parent) {
            Permission::firstOrCreate(['name' => $parent, 'guard_name' => 'web']);
        }

        // Monitoring Viewer: read-only (list + view)
        $viewer = Role::firstOrCreate(['name' => 'Monitoring Viewer', 'guard_name' => 'web']);
        $viewer->syncPermissions([
            "Monitoring",
            "Monitoring.Nodes",
            "Monitoring.Nodes.List Nodes",
            "Monitoring.Nodes.View Node",
        ]);

        // Monitoring Admin: full access
        $admin = Role::firstOrCreate(['name' => 'Monitoring Admin', 'guard_name' => 'web']);
        $admin->syncPermissions([
            "Monitoring",
            "Monitoring.Nodes",
            ...$permissions,
        ]);

        $this->command->info("Monitoring permissions and roles seeded.");
    }
}
