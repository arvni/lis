<?php

declare(strict_types=1);

namespace App\Domains\Notification\Services;

use App\Domains\Notification\Models\Notification;
use App\Domains\Notification\Repositories\NotificationRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

readonly class NotificationService
{
    /**
     * How many unread notifications the bell shows in its dropdown.
     */
    private const BELL_LIMIT = 10;

    public function __construct(private NotificationRepository $notificationRepository) {}

    /**
     * List the authenticated user's notifications, honouring the read/unread
     * tab, the type filter and the search box.
     *
     * @param  array<string, mixed>  $filters
     */
    public function listUserNotifications(array $filters): LengthAwarePaginator
    {
        return $this->notificationRepository->listNotifications([
            ...$filters,
            'notifiable' => $this->currentNotifiable(),
        ]);
    }

    public function makeUnread(Notification $notification): void
    {
        $notification->markAsUnread();
    }

    public function makeRead(Notification $notification): void
    {
        $notification->markAsRead();
    }

    /**
     * The newest unread notifications for the bell dropdown.
     */
    public function getUserUnreadNotifications(): Collection
    {
        return $this->notificationRepository->getUnreadNotifications([
            'notifiable' => $this->currentNotifiable(),
            'take' => self::BELL_LIMIT,
        ]);
    }

    /**
     * Total unread count for the bell badge — not capped by the dropdown limit.
     */
    public function getUserUnreadCount(): int
    {
        return $this->notificationRepository->countUnreadForUser(auth()->id());
    }

    /**
     * Notification classes the user has actually received, for the type filter.
     *
     * @return array<int, string>
     */
    public function getUserNotificationTypes(): array
    {
        return $this->notificationRepository->availableTypesForUser(auth()->id());
    }

    /**
     * Mark the given notifications (owned by the current user) as read.
     *
     * @param  array<int, string>  $ids
     */
    public function markRead(array $ids): void
    {
        $this->notificationRepository->markAsReadForUser(auth()->id(), $ids);
    }

    /**
     * Mark the given notifications (owned by the current user) as unread.
     *
     * @param  array<int, string>  $ids
     */
    public function markUnread(array $ids): void
    {
        $this->notificationRepository->markAsUnreadForUser(auth()->id(), $ids);
    }

    /**
     * Mark all of the current user's unread notifications as read.
     */
    public function markAllRead(): void
    {
        $this->notificationRepository->markAllAsReadForUser(auth()->id());
    }

    /**
     * Delete the given notifications owned by the current user.
     *
     * @param  array<int, string>  $ids
     */
    public function deleteMany(array $ids): void
    {
        $this->notificationRepository->deleteForUser(auth()->id(), $ids);
    }

    /**
     * Every read is scoped to the authenticated user — an unscoped query would
     * expose other users' (and patients') notification payloads.
     *
     * @return array{id: int|string|null, type: string}
     */
    private function currentNotifiable(): array
    {
        return [
            'id' => auth()->id(),
            'type' => 'user',
        ];
    }
}
