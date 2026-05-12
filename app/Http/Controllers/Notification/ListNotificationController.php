<?php

namespace App\Http\Controllers\Notification;

use App\Domains\Notification\Requests\ListNotificationRequest;
use App\Domains\Notification\Resources\NotificationResource;
use App\Domains\Notification\Services\NotificationService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ListNotificationController extends Controller
{
    public function __construct(private NotificationService $notificationService)
    {
    }

    public function __invoke(ListNotificationRequest $request): AnonymousResourceCollection
    {
        $notifications = $this->notificationService->listNotifications($request->all());
        return NotificationResource::collection($notifications);
    }
}
