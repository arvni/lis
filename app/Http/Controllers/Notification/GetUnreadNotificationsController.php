<?php

declare(strict_types=1);

namespace App\Http\Controllers\Notification;

use App\Domains\Notification\Resources\NotificationResource;
use App\Domains\Notification\Services\NotificationService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GetUnreadNotificationsController extends Controller
{
    public function __construct(private readonly NotificationService $notificationService) {}

    /**
     * Feeds the bell in the top app bar.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $notifications = $this->notificationService->getUserUnreadNotifications();

        return response()->json([
            'notifications' => NotificationResource::collection($notifications)->resolve($request),
            'unread_count' => $this->notificationService->getUserUnreadCount(),
        ]);
    }
}
