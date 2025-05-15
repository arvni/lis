<?php

namespace App\Http\Controllers\Notification;

use App\Domains\Notification\Resources\NotificationResource;
use App\Domains\Notification\Services\NotificationService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ListNotificationController extends Controller
{
    public function __construct(private NotificationService $notificationService)
    {
    }

    /**
     * Handle the incoming request.
     * @param Request $request
     * @return AnonymousResourceCollection
     */
    public function __invoke(Request $request): AnonymousResourceCollection
    {
        $notifications = $this->notificationService->listNotifications($request->all());
        return NotificationResource::collection($notifications);
    }
}
