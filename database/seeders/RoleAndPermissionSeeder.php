<?php

namespace Database\Seeders;

use App\Domains\Document\Enums\DocumentTag;
use App\Domains\Laboratory\Models\Section;
use App\Domains\Laboratory\Models\SectionGroup;
use App\Domains\User\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleAndPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [

            "Referrer" => [
                "View Referrer",
                "Create Referrer",
                "Edit Referrer",
                "Delete Referrer",
                "List Referrers",
                "Referrer Orders" => [
                    "View Referrer Order",
                    "Edit Referrer Order",
                    "Delete Referrer Order",
                    "List Referrer Orders",
                    "Add Patient",
                    "Add Acceptance",
                    "Add Samples"
                ],
                "Materials" => [
                    "Create Material",
                    "Edit Material",
                    "Delete Material",
                    "List Materials",
                ],
                "Order Materials" => [
                    "Create Order Material",
                    "View Order Material",
                    "Edit Order Material",
                    "Delete Order Material",
                    "List Order Materials",
                ],
            ],
            "Consultation" => [
                "Consultations" => [
                    "View Consultation",
                    "Done Consultation",
                    "Create Consultation",
                    "Edit Consultation",
                    "Delete Consultation",
                    "List Consultations",
                    "Waiting List Consultations",
                ],
                "Consultants" => [
                    "View Consultant",
                    "Create Consultant",
                    "Edit Consultant",
                    "Delete Consultant",
                    "List Consultants",
                ],
                "Reservations" => [
                    "View Reservation",
                    "Create Reservation",
                    "Edit Reservation",
                    "Delete Reservation",
                    "List Reservations",
                ]
            ],
            "Report" => [
                "View Report",
                "Create Report",
                "Edit Report",
                "Delete Report",
                "List Report",
                "Edit All Reports",
                "Access All Reports",
                "Approve Report",
                "Print Report",
                "Publish Report",
                "Unpublish Report",
            ],
            "Billing" => [
                "Invoices" => [
                    "View Invoice",
                    "Create Invoice",
                    "Edit Invoice",
                    "Delete Invoice",
                    "List Invoices",
                ],
                "Payments" => [
                    "View Payment",
                    "Create Payment",
                    "Edit Payment",
                    "Delete Payment",
                    "List Payments",
                ],
            ],
            "User Management" => [
                "Users" => [
                    "Create User",
                    "Edit User",
                    "Delete User",
                    "List Users",
                ],
                "Roles" => [
                    "Create Role",
                    "Edit Role",
                    "Delete Role",
                    "List Roles",
                ],
            ],
            "Sample Collection" => [
                "Samples" => [
                    "View Sample",
                    "Create Sample",
                    "Delete Sample",
                    "List Samples",
                ],
            ],
            "Reception" => [
                "Patients" => [
                    "View Patient",
                    "Create Patient",
                    "Edit Patient",
                    "Delete Patient",
                    "List Patients",
                ],
                "Acceptances" => [
                    "View Acceptance",
                    "Create Acceptance",
                    "Cancel Acceptance",
                    "Edit Acceptance",
                    "Delete Acceptance",
                    "List Acceptance",
                ],
            ],
            "Advance Settings" => [
                "Section Groups" => [
                    "Create Section Group",
                    "Edit Section Group",
                    "Delete Section Group",
                    "List Section Groups",
                ],
                "Sections" => [
                    "Create Section",
                    "Edit Section",
                    "Delete Section",
                    "List Sections",
                ],
                "Settings" => [
                    "Edit Setting",
                    "List Settings",
                ],
                "Workflows" => [
                    "Create Workflow",
                    "Edit Workflow",
                    "Delete Workflow",
                    "List Workflows",
                ],
                "Sample Types" => [
                    "Create Sample Type",
                    "Edit Sample Type",
                    "Delete Sample Type",
                    "List Sample Types",
                ],
                "Barcode Groups" => [
                    "Create Barcode Group",
                    "Edit Barcode Group",
                    "Delete Barcode Group",
                    "List Barcode Groups",
                ],
                "Offers" => [
                    "Create Offer",
                    "Edit Offer",
                    "Delete Offer",
                    "List Offers",
                ],
                "Doctors" => [
                    "Create Doctor",
                    "Edit Doctor",
                    "Delete Doctor",
                    "List Doctors",
                ],
                "Test Groups" => [
                    "Create Test Group",
                    "Edit Test Group",
                    "Delete Test Group",
                    "List Test Groups",
                ],
                "Report Templates" => [
                    "Create Report Template",
                    "Edit Report Template",
                    "Delete Report Template",
                    "List Report Templates",
                ],
                "Test" => [
                    "Create Test",
                    "Edit Test",
                    "Delete Test",
                    "List Tests",
                ],
            ],
            "Dashboard" => [
                "Total Acceptances",
                "Total Tests",
                "Total Waiting Sampling",
                "Total Consultation",
                "Total Waiting Consultation",
                "Total Payments",
                "Total Reports Waiting For Approving",
            ],
            "Statistics"
        ];

        $sectionPermissions = $this->getSectionsPermissions();
        $documentsPermissions = $this->getDocumentsPermissions();

        $permissions = array_merge($permissions, $sectionPermissions, $documentsPermissions);

        $this->createPermissions($permissions, "");
        $permissions = Permission::all();
        $admin = Role::findOrCreate("Admin");
        $admin->permissions()->sync($permissions->pluck("id"));
        $user = User::query()->where("username", "admin")->first();
        if (!$user)
            $user = User::factory()->create([
                "name" => "Admin",
                "email" => env("ADMIN_EMAIL", "admin@lis.com"),
                "username" => "admin",
                "password" => bcrypt(env("ADMIN_PASSWORD", "P@ssw0rd")),
            ]);
        $user->roles()->sync([$admin->id]);
    }

    protected function createPermissions(array $permissions, string $prefix): void
    {
        if ($prefix)
            Permission::findOrCreate($prefix);
        foreach ($permissions as $group => $permission) {
            if (is_array($permission))
                $this->createPermissions($permission, ($prefix ? "$prefix." : $prefix) . $group);
            else {
                $tmp = $prefix ? "$prefix." : "";
                Permission::findOrCreate("{$tmp}$permission");
            }
        }
    }

    protected function getSectionsPermissions(): array
    {
        $sections = Section::all();
        $permissions = [];
        foreach ($sections as $section) {
            $sectionId = $section->id;
            [$prefix, $sectionGroupPermissions] = $this->getSectionGroupPrefix($section->sectionGroup);
            $permissions = [
                ...$permissions,
                ...$sectionGroupPermissions,
                "Sections$prefix.Section.$sectionId",
                "Sections$prefix.Section.$sectionId.Done",
                "Sections$prefix.Section.$sectionId.Enter",
                "Sections$prefix.Section.$sectionId.Update",
                "Sections$prefix.Section.$sectionId.Reject",
                "Sections$prefix.Section.$sectionId.Dashboard.Total Processing Samples",
                "Sections$prefix.Section.$sectionId.Dashboard.Total Finished Samples",
                "Sections$prefix.Section.$sectionId.Dashboard.Total Started",
                "Sections$prefix.Section.$sectionId.Dashboard.Total Average Duration",
            ];
        }
        return collect($permissions)->unique()->toArray();
    }

    private function getSectionGroupPrefix(SectionGroup $sectionGroup): array
    {
        $idList = $this->getSectionGroupIds($sectionGroup);
        $output = [];
        $tmp = "";
        foreach ($idList as $id) {
            $tmp .= ".$id";
            $output[] = "Sections$tmp";
        }
        return [$tmp, $output];
    }

    private function getSectionGroupIds($sectionGroup): array
    {
        if (isset($sectionGroup["parent"]) && $sectionGroup["section_group_id"]) {
            return [... $this->getSectionGroupIds($sectionGroup["parent"]), $sectionGroup["id"]];
        }
        return [$sectionGroup["id"]];
    }

    private function getDocumentsPermissions(): array
    {
        return Arr::map(DocumentTag::values(), fn($item) => "Documents." . Str::of($item)->replace('_', ' ')->title());
    }

}
