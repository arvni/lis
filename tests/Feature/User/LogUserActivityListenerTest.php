<?php

namespace Tests\Feature\User;

use App\Domains\Shared\Enums\ActionType;
use App\Domains\Shared\Events\ActivityLogged;
use App\Domains\Shared\Traits\LogsUserActivity;
use App\Domains\User\Enums\ActivityType;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LogUserActivityListenerTest extends TestCase
{
    use RefreshDatabase;

    public function test_activity_logged_event_creates_user_activity(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $model = User::factory()->create();
        ActivityLogged::dispatch($model, ActionType::CREATE);

        $this->assertDatabaseHas('user_activities', [
            'user_id' => $user->id,
            'related_type' => $model->getMorphClass(),
            'related_id' => $model->id,
            'activity_type' => ActivityType::CREATE->value,
        ]);
    }

    public function test_action_types_map_to_activity_types(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $model = User::factory()->create();

        ActivityLogged::dispatch($model, ActionType::UPDATE);
        ActivityLogged::dispatch($model, ActionType::DELETE);

        $this->assertDatabaseHas('user_activities', ['activity_type' => ActivityType::UPDATE->value]);
        $this->assertDatabaseHas('user_activities', ['activity_type' => ActivityType::DELETE->value]);
    }

    public function test_trait_dispatches_through_to_user_activity(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $model = User::factory()->create();

        $logger = new class
        {
            use LogsUserActivity;

            public function created(Model $model): void
            {
                $this->logCreated($model);
            }
        };
        $logger->created($model);

        $this->assertDatabaseHas('user_activities', [
            'user_id' => $user->id,
            'related_id' => $model->id,
            'activity_type' => ActivityType::CREATE->value,
        ]);
    }
}
