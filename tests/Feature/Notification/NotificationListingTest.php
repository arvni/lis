<?php

declare(strict_types=1);

namespace Tests\Feature\Notification;

use App\Domains\Notification\Models\Notification;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * The read side of the notification system: the bell dropdown and the
 * notifications page. Both were shipped untested and returned a payload the
 * UI could not read, so every user saw an empty list.
 */
class NotificationListingTest extends TestCase
{
    use RefreshDatabase;

    private function makeNotification(
        User $user,
        bool $read = false,
        string $type = 'App\\Domains\\Reception\\Notifications\\ReportRejected',
        array $data = ['type' => 'report-rejected', 'title' => 'Report Rejected', 'message' => 'hello', 'url' => '/reports/5'],
    ): Notification {
        return Notification::create([
            'id' => (string) Str::uuid(),
            'type' => $type,
            'notifiable_type' => 'user',
            'notifiable_id' => $user->id,
            'data' => $data,
            'read_at' => $read ? now() : null,
        ]);
    }

    public function test_unread_endpoint_returns_notifications_in_the_shape_the_bell_reads(): void
    {
        $user = User::factory()->create();
        $n = $this->makeNotification($user);
        $this->makeNotification($user, read: true);

        $response = $this->actingAs($user)
            ->getJson(route('api.notifications.unread'))
            ->assertOk()
            ->assertJsonPath('unread_count', 1)
            ->assertJsonCount(1, 'notifications');

        $response->assertJsonPath('notifications.0.id', $n->id)
            ->assertJsonPath('notifications.0.title', 'Report Rejected')
            ->assertJsonPath('notifications.0.message', 'hello')
            ->assertJsonPath('notifications.0.url', '/reports/5')
            ->assertJsonPath('notifications.0.read', false);

        $this->assertNotNull($response->json('notifications.0.time'));
    }

    public function test_unread_endpoint_excludes_read_notifications(): void
    {
        $user = User::factory()->create();
        $this->makeNotification($user, read: true);

        $this->actingAs($user)
            ->getJson(route('api.notifications.unread'))
            ->assertOk()
            ->assertJsonPath('unread_count', 0)
            ->assertJsonCount(0, 'notifications');
    }

    public function test_unread_count_is_not_capped_by_the_dropdown_limit(): void
    {
        $user = User::factory()->create();
        for ($i = 0; $i < 12; $i++) {
            $this->makeNotification($user);
        }

        $this->actingAs($user)
            ->getJson(route('api.notifications.unread'))
            ->assertOk()
            ->assertJsonCount(10, 'notifications')
            ->assertJsonPath('unread_count', 12);
    }

    public function test_title_falls_back_to_the_notification_class_when_the_payload_has_none(): void
    {
        $user = User::factory()->create();
        $this->makeNotification(
            $user,
            type: 'App\\Domains\\Inventory\\Notifications\\PurchaseRequestApprovedNotification',
            data: ['type' => 'pr_approved', 'message' => 'PR #3 approved', 'link' => '/inventory/purchase-requests/3'],
        );

        $this->actingAs($user)
            ->getJson(route('api.notifications.unread'))
            ->assertOk()
            ->assertJsonPath('notifications.0.title', 'Purchase Request Approved')
            ->assertJsonPath('notifications.0.url', '/inventory/purchase-requests/3');
    }

    public function test_index_returns_notifications_and_pagination_meta(): void
    {
        $user = User::factory()->create();
        $this->makeNotification($user);

        $this->actingAs($user)
            ->getJson(route('api.notifications.index'))
            ->assertOk()
            ->assertJsonCount(1, 'notifications')
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('meta.last_page', 1)
            ->assertJsonPath('meta.current_page', 1);
    }

    public function test_index_only_returns_the_authenticated_users_notifications(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $mine = $this->makeNotification($owner);
        $theirs = $this->makeNotification($other);

        $response = $this->actingAs($owner)
            ->getJson(route('api.notifications.index'))
            ->assertOk()
            ->assertJsonCount(1, 'notifications')
            ->assertJsonPath('notifications.0.id', $mine->id);

        $this->assertStringNotContainsString($theirs->id, $response->getContent());
    }

    public function test_index_honours_the_unread_and_read_tabs(): void
    {
        $user = User::factory()->create();
        $unread = $this->makeNotification($user);
        $read = $this->makeNotification($user, read: true);

        $this->actingAs($user)
            ->getJson(route('api.notifications.index', ['filter' => 'unread']))
            ->assertOk()
            ->assertJsonCount(1, 'notifications')
            ->assertJsonPath('notifications.0.id', $unread->id);

        $this->actingAs($user)
            ->getJson(route('api.notifications.index', ['filter' => 'read']))
            ->assertOk()
            ->assertJsonCount(1, 'notifications')
            ->assertJsonPath('notifications.0.id', $read->id);
    }

    public function test_index_honours_the_search_box(): void
    {
        $user = User::factory()->create();
        $match = $this->makeNotification($user, data: ['title' => 'Report Rejected', 'message' => 'needle in here']);
        $this->makeNotification($user, data: ['title' => 'Report Rejected', 'message' => 'something else']);

        $this->actingAs($user)
            ->getJson(route('api.notifications.index', ['search' => 'needle']))
            ->assertOk()
            ->assertJsonCount(1, 'notifications')
            ->assertJsonPath('notifications.0.id', $match->id);
    }

    public function test_index_honours_the_type_filter_and_advertises_available_types(): void
    {
        $user = User::factory()->create();
        $report = $this->makeNotification($user);
        $this->makeNotification(
            $user,
            type: 'App\\Domains\\Inventory\\Notifications\\ReorderAlertNotification',
            data: ['type' => 'reorder_alert', 'message' => 'Low stock'],
        );

        $response = $this->actingAs($user)
            ->getJson(route('api.notifications.index'))
            ->assertOk()
            ->assertJsonCount(2, 'types');

        $labels = array_column($response->json('types'), 'label');
        sort($labels);
        $this->assertSame(['Reorder Alert', 'Report Rejected'], $labels);

        $this->actingAs($user)
            ->getJson(route('api.notifications.index', ['type' => 'App\\Domains\\Reception\\Notifications\\ReportRejected']))
            ->assertOk()
            ->assertJsonCount(1, 'notifications')
            ->assertJsonPath('notifications.0.id', $report->id);
    }

    public function test_index_returns_newest_first(): void
    {
        $user = User::factory()->create();
        $older = $this->makeNotification($user);
        $older->forceFill(['created_at' => now()->subDay()])->save();
        $newer = $this->makeNotification($user);

        $this->actingAs($user)
            ->getJson(route('api.notifications.index'))
            ->assertOk()
            ->assertJsonPath('notifications.0.id', $newer->id)
            ->assertJsonPath('notifications.1.id', $older->id);
    }

    public function test_index_rejects_an_unknown_filter(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson(route('api.notifications.index', ['filter' => 'everything']))
            ->assertStatus(422);
    }

    public function test_guests_cannot_read_notifications(): void
    {
        $this->getJson(route('api.notifications.unread'))->assertUnauthorized();
        $this->getJson(route('api.notifications.index'))->assertUnauthorized();
    }
}
