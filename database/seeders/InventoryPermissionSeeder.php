<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class InventoryPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            "Inventory.Items.List Items",
            "Inventory.Items.View Item",
            "Inventory.Items.Create Item",
            "Inventory.Items.Edit Item",
            "Inventory.Items.Delete Item",

            "Inventory.Suppliers.List Suppliers",
            "Inventory.Suppliers.View Supplier",
            "Inventory.Suppliers.Create Supplier",
            "Inventory.Suppliers.Edit Supplier",
            "Inventory.Suppliers.Delete Supplier",

            "Inventory.Stores.List Stores",
            "Inventory.Stores.View Store",
            "Inventory.Stores.Create Store",
            "Inventory.Stores.Edit Store",
            "Inventory.Stores.Delete Store",

            "Inventory.Transactions.List Transactions",
            "Inventory.Transactions.View Transaction",
            "Inventory.Transactions.Create Transaction",
            "Inventory.Transactions.Approve Transaction",
            "Inventory.Transactions.Cancel Transaction",

            "Inventory.PurchaseRequests.List Purchase Requests",
            "Inventory.PurchaseRequests.View All Purchase Requests",
            "Inventory.PurchaseRequests.Create Purchase Request",
            "Inventory.PurchaseRequests.Approve Purchase Request",

            "Inventory.Stock.View Stock",
            "Inventory.ReorderAlerts.View Reorder Alerts",
            "Inventory.ReorderAlerts.Resolve Reorder Alert",

            "Inventory.WorkflowTemplates.List Workflow Templates",
            "Inventory.WorkflowTemplates.Manage Workflow Templates",
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        $allInventoryPerms = collect($permissions);

        // Store Manager: full access including workflow template management
        $manager = Role::firstOrCreate(['name' => 'Store Manager', 'guard_name' => 'web']);
        $manager->syncPermissions($allInventoryPerms->all());

        // Store Staff: create/view transactions and stock, no approve/delete
        $staff = Role::firstOrCreate(['name' => 'Store Staff', 'guard_name' => 'web']);
        $staff->syncPermissions($allInventoryPerms->filter(fn($p) =>
            !str_contains($p, 'Approve') &&
            !str_contains($p, 'Delete') &&
            !str_contains($p, 'Resolve')
        )->values()->all());

        // Inventory Viewer: read-only
        $viewer = Role::firstOrCreate(['name' => 'Inventory Viewer', 'guard_name' => 'web']);
        $viewer->syncPermissions($allInventoryPerms->filter(fn($p) =>
            str_contains($p, 'List') || str_contains($p, 'View')
        )->values()->all());

        // Inventory Approver: approve transactions and purchase requests
        $approver = Role::firstOrCreate(['name' => 'Inventory Approver', 'guard_name' => 'web']);
        $approver->syncPermissions($allInventoryPerms->filter(fn($p) =>
            str_contains($p, 'Approve') ||
            str_contains($p, 'List') ||
            str_contains($p, 'View')
        )->values()->all());

        $this->command->info("Inventory permissions and roles seeded.");
    }
}
