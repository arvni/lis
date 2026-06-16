<?php

namespace Tests\Feature\User;

use App\Domains\User\DTOs\UserDTO;
use App\Domains\User\Models\User;
use App\Domains\User\Repositories\UserRepository;
use App\Domains\User\Services\UserService;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Event;
use Mockery;
use Tests\TestCase;

class UserServiceTest extends TestCase
{
    private UserRepository $repo;
    private UserService $service;

    protected function setUp(): void
    {
        parent::setUp();
        Event::fake();
        $this->repo = Mockery::mock(UserRepository::class);
        $this->service = new UserService($this->repo);
    }

    private function dto(array $roles = []): UserDTO
    {
        $dto = Mockery::mock(UserDTO::class);
        $dto->shouldReceive('toArray')->andReturn(['name' => 'Jane', 'roles' => $roles]);
        $dto->roles = $roles;
        $dto->signature = null;
        $dto->stamp = null;
        return $dto;
    }

    private function userWithRoles(): User
    {
        $rolesRel = Mockery::mock(BelongsToMany::class);
        $rolesRel->shouldReceive('sync')->andReturn([]);
        $user = Mockery::mock(User::class)->makePartial();
        $user->shouldReceive('roles')->andReturn($rolesRel);
        return $user;
    }

    public function test_list_delegates(): void
    {
        $paginator = new LengthAwarePaginator([], 0, 10);
        $this->repo->shouldReceive('all')->once()->andReturn($paginator);
        $this->assertSame($paginator, $this->service->listUsers([]));
    }

    public function test_create_persists_and_syncs_roles(): void
    {
        $user = $this->userWithRoles();
        $this->repo->shouldReceive('create')->once()->andReturn($user);

        $result = $this->service->createUser($this->dto([['id' => 1], ['id' => 2]]));
        $this->assertSame($user, $result);
    }

    public function test_update_persists_and_syncs_roles(): void
    {
        $user = $this->userWithRoles();
        $this->repo->shouldReceive('update')->once()->andReturn($user);

        $result = $this->service->updateUser($user, $this->dto([['id' => 3]]));
        $this->assertSame($user, $result);
    }

    public function test_delete_delegates(): void
    {
        $user = new User();
        $this->repo->shouldReceive('delete')->once()->with($user)->andReturnNull();
        $this->service->deleteUser($user);
        $this->assertTrue(true);
    }
}
