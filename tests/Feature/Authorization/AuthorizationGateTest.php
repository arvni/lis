<?php

namespace Tests\Feature\Authorization;

use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Pins the authorization gates added by the #17 authz-coverage audit: endpoints that
 * previously enforced nothing (no controller check + `return true` FormRequests) must now
 * 403 a user lacking the mapped permission, and allow one that holds it. See
 * docs/authz-matrix.md for the full route→ability matrix.
 */
class AuthorizationGateTest extends TestCase
{
    use RefreshDatabase;

    private function user(?string $permission = null): User
    {
        $user = User::factory()->create();
        if ($permission !== null) {
            Permission::findOrCreate($permission);
            $user->givePermissionTo($permission);
        }
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }

    /**
     * @return array<string, array{route:string, params:array<string,mixed>, permission:string}>
     */
    public static function gatedEndpoints(): array
    {
        return [
            'list users (staff PII)' => [
                'route' => 'api.users.list', 'params' => [], 'permission' => 'User Management.Users.List Users',
            ],
            'patient import (PHI, bulk)' => [
                'route' => 'import', 'params' => [], 'permission' => 'Reception.Acceptances.Create Acceptance',
            ],
            'export acceptance items (PHI)' => [
                'route' => 'acceptanceItems.export', 'params' => [], 'permission' => 'Reception.Acceptances.List Acceptance',
            ],
            'patient lookup by national id (PHI)' => [
                'route' => 'api.patients.getByIdNo', 'params' => ['idNo' => 'NOPE123'], 'permission' => 'Reception.Patients.List Patients',
            ],
        ];
    }

    /**
     * @param  array<string,mixed>  $params
     */
    #[DataProvider('gatedEndpoints')]
    public function test_endpoint_forbids_user_without_permission(string $route, array $params, string $permission): void
    {
        $this->actingAs($this->user());

        $this->get(route($route, $params))->assertForbidden();
    }

    /**
     * @param  array<string,mixed>  $params
     */
    #[DataProvider('gatedEndpoints')]
    public function test_endpoint_allows_user_with_permission(string $route, array $params, string $permission): void
    {
        $this->actingAs($this->user($permission));

        // A holder of the permission clears the gate — anything but 403 proves that
        // (a 404 for the deliberately-missing patient still means the gate passed).
        $response = $this->get(route($route, $params));

        $this->assertNotSame(403, $response->baseResponse->getStatusCode());
    }
}
