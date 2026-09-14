<?php

declare(strict_types=1);

namespace Tests\Feature\User;

use App\Domains\User\Models\Role;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class UserAttendanceNumberTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    public function test_a_new_user_keeps_the_attendance_number_as_typed(): void
    {
        $this->actingAs($this->permittedUser())
            ->post(route('users.store'), $this->payload(['attendance_number' => '00123']))
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('users.index'));

        $this->assertSame('00123', User::query()->firstWhere('username', 'jdoe')?->attendance_number);
    }

    public function test_the_attendance_number_is_optional(): void
    {
        $this->actingAs($this->permittedUser())
            ->post(route('users.store'), $this->payload(['attendance_number' => '']))
            ->assertSessionHasNoErrors();

        $this->assertNull(User::query()->firstWhere('username', 'jdoe')?->attendance_number);
    }

    public function test_two_users_cannot_share_an_attendance_number(): void
    {
        User::factory()->create(['attendance_number' => '00123']);

        $this->actingAs($this->permittedUser())
            ->post(route('users.store'), $this->payload(['attendance_number' => '00123']))
            ->assertSessionHasErrors('attendance_number');
    }

    public function test_updating_a_user_keeps_their_own_number_but_not_someone_elses(): void
    {
        $user = User::factory()->create(['username' => 'jdoe', 'email' => 'jdoe@example.com', 'attendance_number' => '00123']);
        User::factory()->create(['attendance_number' => '00999']);
        $editor = $this->permittedUser();

        $this->actingAs($editor)
            ->put(route('users.update', $user->id), $this->payload(['attendance_number' => '00123']))
            ->assertSessionHasNoErrors();

        $this->actingAs($editor)
            ->put(route('users.update', $user->id), $this->payload(['attendance_number' => '00999']))
            ->assertSessionHasErrors('attendance_number');

        $this->actingAs($editor)
            ->put(route('users.update', $user->id), $this->payload(['attendance_number' => '00456']))
            ->assertSessionHasNoErrors();

        $this->assertSame('00456', $user->refresh()->attendance_number);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        $role = Role::findOrCreate('Receptionist', 'web');

        return array_merge([
            'name' => 'Jane Doe',
            'username' => 'jdoe',
            'email' => 'jdoe@example.com',
            'mobile' => '99999999',
            'password' => 'secret-password',
            'password_confirmation' => 'secret-password',
            'title' => null,
            'roles' => [['id' => $role->id]],
            'is_active' => true,
        ], $overrides);
    }

    private function permittedUser(): User
    {
        $user = User::factory()->create();

        foreach (['User Management.Users.Create User', 'User Management.Users.Edit User'] as $permission) {
            Permission::findOrCreate($permission);
            $user->givePermissionTo($permission);
        }
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }
}
