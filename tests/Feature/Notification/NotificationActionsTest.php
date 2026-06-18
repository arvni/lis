<?php

namespace Tests\Feature\Notification;

use App\Domains\Notification\Models\Notification;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class NotificationActionsTest extends TestCase
{
    use RefreshDatabase;

    private function makeNotification(User $user, bool $read = false): Notification
    {
        return Notification::create([
            'id' => (string) Str::uuid(),
            'type' => 'App\\Notifications\\TestNotification',
            'notifiable_type' => 'user',
            'notifiable_id' => $user->id,
            'data' => ['message' => 'hello'],
            'read_at' => $read ? now() : null,
        ]);
    }

    public function test_mark_as_read_marks_the_users_notification_read(): void
    {
        $user = User::factory()->create();
        $n = $this->makeNotification($user);

        $this->actingAs($user)
            ->postJson(route('api.notifications.markAsRead'), ['ids' => [$n->id]])
            ->assertNoContent();

        $this->assertNotNull($n->fresh()->read_at);
    }

    public function test_mark_as_read_accepts_a_single_id_param(): void
    {
        $user = User::factory()->create();
        $n = $this->makeNotification($user);

        // The bell sends the id as a query/param rather than an ids array.
        $this->actingAs($user)
            ->postJson(route('api.notifications.markAsRead', ['id' => $n->id]))
            ->assertNoContent();

        $this->assertNotNull($n->fresh()->read_at);
    }

    public function test_mark_all_as_read_marks_every_unread_notification(): void
    {
        $user = User::factory()->create();
        $a = $this->makeNotification($user);
        $b = $this->makeNotification($user);

        $this->actingAs($user)
            ->postJson(route('api.notifications.markAllAsRead'))
            ->assertNoContent();

        $this->assertNotNull($a->fresh()->read_at);
        $this->assertNotNull($b->fresh()->read_at);
    }

    public function test_mark_as_unread_clears_read_at(): void
    {
        // Guards against the regressed makeUnread bug (it used to mark read).
        $user = User::factory()->create();
        $n = $this->makeNotification($user, read: true);

        $this->actingAs($user)
            ->postJson(route('api.notifications.markAsUnread'), ['ids' => [$n->id]])
            ->assertNoContent();

        $this->assertNull($n->fresh()->read_at);
    }

    public function test_delete_removes_the_notification(): void
    {
        $user = User::factory()->create();
        $n = $this->makeNotification($user);

        $this->actingAs($user)
            ->deleteJson(route('api.notifications.delete'), ['ids' => [$n->id]])
            ->assertNoContent();

        $this->assertDatabaseMissing('notifications', ['id' => $n->id]);
    }

    public function test_a_user_cannot_act_on_another_users_notifications(): void
    {
        $owner = User::factory()->create();
        $attacker = User::factory()->create();
        $n = $this->makeNotification($owner);

        $this->actingAs($attacker)
            ->postJson(route('api.notifications.markAsRead'), ['ids' => [$n->id]])
            ->assertNoContent();

        // Owner's notification is untouched.
        $this->assertNull($n->fresh()->read_at);

        $this->actingAs($attacker)
            ->deleteJson(route('api.notifications.delete'), ['ids' => [$n->id]])
            ->assertNoContent();

        $this->assertDatabaseHas('notifications', ['id' => $n->id]);
    }
}
