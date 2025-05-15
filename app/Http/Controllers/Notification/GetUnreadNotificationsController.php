<?php

namespace App\Http\Controllers\Notification;

use App\Domains\Notification\Resources\NotificationResource;
use App\Domains\Notification\Services\NotificationService;
use App\Http\Controllers\Controller;

class GetUnreadNotificationsController extends Controller
{
    public function __construct(private readonly NotificationService $notificationService)
    {
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke()
    {
        $notifications = $this->notificationService->getUserUnreadNotifications();
        return NotificationResource::collection($notifications);
    }
}
