<?php

namespace App\Http\Controllers\Notification;

use App\Domains\Notification\Requests\NotificationIdsRequest;
use App\Domains\Notification\Services\NotificationService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Response;

class MarkNotificationsAsReadController extends Controller
{
    public function __construct(private readonly NotificationService $notificationService)
    {
    }

    public function __invoke(NotificationIdsRequest $request): Response
    {
        $this->notificationService->markRead($request->ids());
        return response()->noContent();
    }
}
