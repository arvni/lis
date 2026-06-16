<?php

namespace Tests\Feature\User;

use App\Domains\User\Enums\ActivityType;
use App\Domains\User\Models\User;
use App\Domains\User\Services\UserActivityService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserActivityServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_creates_activity_for_authenticated_user(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $model = User::factory()->create();
        UserActivityService::createUserActivity($model, ActivityType::cases()[0]);

        $this->assertDatabaseHas('user_activities', [
            'user_id'      => $user->id,
            'related_type' => $model->getMorphClass(),
            'related_id'   => $model->id,
        ]);
    }

    public function test_does_nothing_without_authenticated_user(): void
    {
        $model = User::factory()->create();
        UserActivityService::createUserActivity($model, ActivityType::cases()[0]);

        $this->assertDatabaseCount('user_activities', 0);
    }
}
