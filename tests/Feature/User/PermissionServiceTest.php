<?php

namespace Tests\Feature\User;

use App\Domains\Document\Enums\DocumentTag;
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

    public function test_get_user_allowed_document_tags_resolves_permissions_to_tags(): void
    {
        // Permission names are "Documents.<Tag Title>" (title is the tag value with
        // underscores replaced by spaces, title-cased). The service reverses that to
        // a DocumentTag, ignores non-document permissions, and drops CRUD permissions
        // ("View Document") that don't map to a tag.
        $this->repo->shouldReceive('getUserAllPermissions')->once()->andReturn(new Collection([
            (object) ['name' => 'Documents.Avatar'],
            (object) ['name' => 'Documents.Medical History'],
            (object) ['name' => 'Documents.View Document'], // CRUD perm → not a tag
            (object) ['name' => 'Acceptance.View'],         // unrelated permission
        ]));

        $tags = $this->service->getUserAllowedDocumentTags();

        $this->assertIsArray($tags);
        $this->assertSame([DocumentTag::AVATAR, DocumentTag::MEDICAL_HISTORY], $tags);
    }
}
