<?php

namespace Tests\Feature\User;

use App\Domains\Shared\Contracts\SectionLookupInterface;
use App\Domains\User\Models\Role;
use App\Domains\User\Repositories\RoleRepository;
use App\Domains\User\Services\RoleService;
use Illuminate\Pagination\LengthAwarePaginator;
use Mockery;
use Tests\TestCase;

class RoleServiceTest extends TestCase
{
    private RoleRepository $repo;
    private RoleService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repo = Mockery::mock(RoleRepository::class);
        $this->service = new RoleService($this->repo, Mockery::mock(SectionLookupInterface::class));
    }

    public function test_list_delegates(): void
    {
        $paginator = new LengthAwarePaginator([], 0, 10);
        $this->repo->shouldReceive('list')->once()->andReturn($paginator);
        $this->assertSame($paginator, $this->service->listRoles([]));
    }

    public function test_create_delegates(): void
    {
        $role = new Role();
        $this->repo->shouldReceive('create')->once()->with(['name' => 'Admin'])->andReturn($role);
        $this->assertSame($role, $this->service->createRole(['name' => 'Admin']));
    }

    public function test_update_delegates(): void
    {
        $role = new Role();
        $this->repo->shouldReceive('edit')->once()->with($role, ['name' => 'X'])->andReturn($role);
        $this->assertSame($role, $this->service->updateRole($role, ['name' => 'X']));
    }

    public function test_delete_delegates(): void
    {
        $role = new Role();
        $this->repo->shouldReceive('delete')->once()->with($role)->andReturnNull();
        $this->service->deleteRole($role);
        $this->assertTrue(true);
    }

    public function test_get_admin_role_delegates(): void
    {
        $role = new Role();
        $this->repo->shouldReceive('getAdminRole')->once()->andReturn($role);
        $this->assertSame($role, $this->service->getAdminRole());
    }
}
