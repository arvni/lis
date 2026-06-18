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

    public function test_get_unread_delegates(): void
    {
        $collection = new Collection();
        $this->repo->shouldReceive('getUnreadNotifications')->once()->with(['q' => 1])->andReturn($collection);
        $this->assertSame($collection, $this->service->getUnreadNotifications(['q' => 1]));
    }

    public function test_list_notifications_delegates(): void
    {
        $paginator = new LengthAwarePaginator([], 0, 10);
        $this->repo->shouldReceive('listNotifications')->once()->andReturn($paginator);
        $this->assertSame($paginator, $this->service->listNotifications([]));
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

        $collection = new Collection();
        $this->repo->shouldReceive('getUnreadNotifications')->once()
            ->with(['notifiable' => ['id' => 77, 'type' => 'user']])
            ->andReturn($collection);

        $this->assertSame($collection, $this->service->getUserUnreadNotifications());
    }
}
