<?php

namespace App\Domains\Notification\Services;

use App\Domains\Notification\Models\Notification;
use App\Domains\Notification\Repositories\NotificationRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

readonly class NotificationService
{

    public function __construct(private NotificationRepository $notificationRepository)
    {
    }

    /**
     * @param $queryData
     * @return Collection
     */
    public function getUnreadNotifications($queryData): Collection
    {
        return $this->notificationRepository->getUnreadNotifications($queryData);
    }

    /**
     * @param $queryData
     * @return LengthAwarePaginator
     */
    public function listNotifications($queryData): LengthAwarePaginator
    {
        return $this->notificationRepository->listNotifications($queryData);
    }

    /**
     * @param Notification $notification
     * @return void
     */
    public function makeUnread(Notification $notification): void
    {
        $notification->markAsUnread();
    }

    /**
     * @param Notification $notification
     * @return void
     */
    public function makeRead(Notification $notification): void
    {
        $notification->markAsRead();
    }

    public function getUserUnreadNotifications(): Collection
    {
        return $this->notificationRepository->getUnreadNotifications([
            'notifiable' => [
                'id' => auth()->id(),
                'type' => 'user',
            ]
        ]);
    }

    /**
     * Mark the given notifications (owned by the current user) as read.
     *
     * @param array<int, string> $ids
     */
    public function markRead(array $ids): void
    {
        $this->notificationRepository->markAsReadForUser(auth()->id(), $ids);
    }

    /**
     * Mark the given notifications (owned by the current user) as unread.
     *
     * @param array<int, string> $ids
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
     * @param array<int, string> $ids
     */
    public function deleteMany(array $ids): void
    {
        $this->notificationRepository->deleteForUser(auth()->id(), $ids);
    }

}
