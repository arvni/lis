<?php

declare(strict_types=1);

namespace App\Http\Controllers\Notification;

use App\Domains\Notification\Requests\ListNotificationRequest;
use App\Domains\Notification\Resources\NotificationResource;
use App\Domains\Notification\Services\NotificationService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class ListNotificationController extends Controller
{
    public function __construct(private NotificationService $notificationService) {}

    public function __invoke(ListNotificationRequest $request): JsonResponse
    {
        $paginator = $this->notificationService->listUserNotifications($request->filters());

        return response()->json([
            'notifications' => NotificationResource::collection($paginator->getCollection())->resolve($request),
            'unread_count' => $this->notificationService->getUserUnreadCount(),
            'types' => collect($this->notificationService->getUserNotificationTypes())
                ->map(fn (string $type): array => [
                    'value' => $type,
                    'label' => NotificationResource::labelFor($type),
                ])
                ->values(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }
}
