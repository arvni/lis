<?php

namespace Tests\Feature\User;

use App\Domains\User\Repositories\PermissionRepository;
use App\Domains\User\Services\PermissionService;
use Illuminate\Support\Collection;
use Mockery;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class PermissionServiceTest extends TestCase
{
    private PermissionRepository $repo;
    private PermissionService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repo = Mockery::mock(PermissionRepository::class);
        $this->service = new PermissionService($this->repo);
    }

    public function test_create_delegates(): void
    {
        $permission = new Permission(['name' => 'X']);
        $this->repo->shouldReceive('create')->once()->with('X')->andReturn($permission);
        $this->assertSame($permission, $this->service->createPermission('X'));
    }

    public function test_update_delegates(): void
    {
        $permission = new Permission();
        $this->repo->shouldReceive('edit')->once()->with($permission, ['name' => 'Y'])->andReturn($permission);
        $this->assertSame($permission, $this->service->updatePermission($permission, ['name' => 'Y']));
    }

    public function test_delete_delegates(): void
    {
        $permission = new Permission();
        $this->repo->shouldReceive('delete')->once()->with($permission)->andReturnNull();
        $this->service->deletePermission($permission);
        $this->assertTrue(true);
    }

    public function test_get_by_name_delegates(): void
    {
        $permission = new Permission();
        $this->repo->shouldReceive('getPermissionByName')->once()->with('A')->andReturn($permission);
        $this->assertSame($permission, $this->service->getPermissionByName('A'));
    }

    public function test_get_user_allowed_document_tags_has_return_type_bug(): void
    {
        // Characterization test: getUserAllowedDocumentTags() is declared `: array`
        // but its body returns a Collection (->filter()->map()), so the method
        // always raises a TypeError. This pins the current (buggy) behaviour so a
        // future fix that returns an array will visibly flip this test.
        $this->repo->shouldReceive('getUserAllPermissions')->once()->andReturn(new Collection([
            (object) ['name' => 'Documents.Avatar'],
        ]));

        $this->expectException(\TypeError::class);
        $this->service->getUserAllowedDocumentTags();
    }
}
