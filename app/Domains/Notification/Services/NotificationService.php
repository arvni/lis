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
        $notification->markAsRead();
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

}
