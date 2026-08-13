<?php

namespace Tests\Feature\Notification;

use App\Domains\Notification\Models\Notification;
use App\Domains\Notification\Repositories\NotificationRepository;
use App\Domains\Notification\Services\NotificationService;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Mockery;
use Tests\TestCase;

class NotificationServiceTest extends TestCase
{
    private NotificationRepository $repo;

    private NotificationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repo = Mockery::mock(NotificationRepository::class);
        $this->service = new NotificationService($this->repo);
    }

    public function test_list_user_notifications_scopes_to_the_authenticated_user(): void
    {
        $user = User::factory()->make();
        $user->id = 77;
        $this->actingAs($user);

        $paginator = new LengthAwarePaginator([], 0, 10);
        $this->repo->shouldReceive('listNotifications')->once()
            ->with([
                'filter' => 'unread',
                'notifiable' => ['id' => 77, 'type' => 'user'],
            ])
            ->andReturn($paginator);

        $this->assertSame($paginator, $this->service->listUserNotifications(['filter' => 'unread']));
    }

    public function test_unread_count_delegates_for_the_authenticated_user(): void
    {
        $user = User::factory()->make();
        $user->id = 77;
        $this->actingAs($user);

        $this->repo->shouldReceive('countUnreadForUser')->once()->with(77)->andReturn(4);

        $this->assertSame(4, $this->service->getUserUnreadCount());
    }

    public function test_make_read_marks_notification_read(): void
    {
        $notification = Mockery::mock(Notification::class);
        $notification->shouldReceive('markAsRead')->once();
        $this->service->makeRead($notification);
        $this->assertTrue(true);
    }

    public function test_make_unread_marks_notification_unread(): void
    {
        $notification = Mockery::mock(Notification::class);
        $notification->shouldReceive('markAsUnread')->once();
        $this->service->makeUnread($notification);
        $this->assertTrue(true);
    }

    public function test_get_user_unread_uses_authenticated_user(): void
    {
        $user = User::factory()->make();
        $user->id = 77;
        $this->actingAs($user);

        $collection = new Collection;
        $this->repo->shouldReceive('getUnreadNotifications')->once()
            ->with(['notifiable' => ['id' => 77, 'type' => 'user'], 'take' => 10])
            ->andReturn($collection);

        $this->assertSame($collection, $this->service->getUserUnreadNotifications());
    }
}
