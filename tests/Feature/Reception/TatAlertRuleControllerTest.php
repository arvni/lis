<?php

declare(strict_types=1);

namespace Tests\Feature\Reception;

use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Reception\Models\TatAlertRule;
use App\Domains\User\Models\Role;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class TatAlertRuleControllerTest extends TestCase
{
    use RefreshDatabase;

    private const PERMISSIONS = [
        'Advance Settings.TAT Alerts.List TAT Alerts',
        'Advance Settings.TAT Alerts.Create TAT Alert',
        'Advance Settings.TAT Alerts.Edit TAT Alert',
        'Advance Settings.TAT Alerts.Delete TAT Alert',
    ];

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    public function test_listing_requires_permission(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('tat-alert-rules.index'))
            ->assertForbidden();
    }

    public function test_creating_requires_permission(): void
    {
        $this->actingAs(User::factory()->create())
            ->post(route('tat-alert-rules.store'), $this->payload())
            ->assertForbidden();

        $this->assertSame(0, TatAlertRule::query()->count());
    }

    public function test_a_permitted_user_sees_the_alert_list(): void
    {
        $rule = TatAlertRule::create(['name' => 'Cultures due soon', 'days_left' => 2]);
        $test = $this->makeTest();
        $rule->tests()->attach($test->id);

        // The grid reads `total` from the top level of the page data, so it must not be
        // tucked under a resource collection's `meta`.
        $this->actingAs($this->permittedUser())
            ->get(route('tat-alert-rules.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('TatAlertRule/Index', false)
                ->where('rules.total', 1)
                ->where('rules.current_page', 1)
                ->where('rules.data.0.name', 'Cultures due soon')
                ->where('rules.data.0.tests.0.id', $test->id));
    }

    public function test_an_alert_is_created_with_its_tests_users_and_roles(): void
    {
        $test = $this->makeTest();
        $user = User::factory()->create();
        $role = $this->makeRole();

        $this->actingAs($this->permittedUser())
            ->post(route('tat-alert-rules.store'), $this->payload([
                'days_left' => '2',
                'tests' => [['id' => $test->id, 'name' => $test->name]],
                'users' => [['id' => $user->id]],
                'roles' => [['id' => $role->id]],
            ]))
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $rule = TatAlertRule::query()->firstWhere('name', 'Cultures due soon');

        $this->assertNotNull($rule);
        $this->assertSame(2, $rule->days_left);
        $this->assertTrue($rule->active);
        $this->assertSame([$test->id], $rule->tests->pluck('id')->all());
        $this->assertSame([$user->id], $rule->users->pluck('id')->all());
        $this->assertSame([$role->id], $rule->roles->pluck('id')->all());
    }

    public function test_an_alert_needs_at_least_one_test(): void
    {
        $this->actingAs($this->permittedUser())
            ->post(route('tat-alert-rules.store'), $this->payload(['tests' => []]))
            ->assertSessionHasErrors('tests');
    }

    public function test_an_alert_needs_a_user_or_a_role_to_notify(): void
    {
        $this->actingAs($this->permittedUser())
            ->post(route('tat-alert-rules.store'), $this->payload(['users' => [], 'roles' => []]))
            ->assertSessionHasErrors(['users', 'roles']);
    }

    public function test_a_role_alone_is_enough_to_notify(): void
    {
        $this->actingAs($this->permittedUser())
            ->post(route('tat-alert-rules.store'), $this->payload([
                'users' => [],
                'roles' => [['id' => $this->makeRole()->id]],
            ]))
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $this->assertSame(1, TatAlertRule::query()->count());
    }

    public function test_updating_an_alert_replaces_its_relations(): void
    {
        $rule = TatAlertRule::create(['name' => 'Cultures due soon', 'days_left' => 2]);
        $rule->tests()->attach($this->makeTest()->id);
        $rule->users()->attach(User::factory()->create()->id);
        $replacementTest = $this->makeTest();
        $role = $this->makeRole();

        $this->actingAs($this->permittedUser())
            ->put(route('tat-alert-rules.update', $rule->id), $this->payload([
                'name' => 'Cultures overdue',
                'days_left' => 0,
                'active' => false,
                'tests' => [['id' => $replacementTest->id]],
                'users' => [],
                'roles' => [['id' => $role->id]],
            ]))
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $rule->refresh()->load('tests', 'users', 'roles');

        $this->assertSame('Cultures overdue', $rule->name);
        $this->assertSame(0, $rule->days_left);
        $this->assertFalse($rule->active);
        $this->assertSame([$replacementTest->id], $rule->tests->pluck('id')->all());
        $this->assertTrue($rule->users->isEmpty());
        $this->assertSame([$role->id], $rule->roles->pluck('id')->all());
    }

    public function test_an_alert_is_soft_deleted(): void
    {
        $rule = TatAlertRule::create(['name' => 'Cultures due soon', 'days_left' => 2]);

        $this->actingAs($this->permittedUser())
            ->delete(route('tat-alert-rules.destroy', $rule->id))
            ->assertRedirect();

        $this->assertSoftDeleted('tat_alert_rules', ['id' => $rule->id]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Cultures due soon',
            'days_left' => 1,
            'active' => true,
            'tests' => [['id' => $this->makeTest()->id]],
            'users' => [['id' => User::factory()->create()->id]],
            'roles' => [],
        ], $overrides);
    }

    private function makeTest(): Test
    {
        return Test::create([
            'name' => 'Culture '.uniqid(),
            'fullName' => 'Culture',
            'code' => 'CU'.uniqid(),
            'type' => TestType::TEST,
            'status' => true,
            'can_merge' => false,
        ]);
    }

    private function makeRole(): Role
    {
        return Role::create(['name' => 'Lab Supervisor '.uniqid(), 'guard_name' => 'web']);
    }

    private function permittedUser(): User
    {
        $user = User::factory()->create();

        foreach (self::PERMISSIONS as $permission) {
            Permission::findOrCreate($permission);
            $user->givePermissionTo($permission);
        }
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }
}
