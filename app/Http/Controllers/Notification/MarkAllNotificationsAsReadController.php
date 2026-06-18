<?php

namespace App\Http\Controllers\Notification;

use App\Domains\Notification\Services\NotificationService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Response;

class MarkAllNotificationsAsReadController extends Controller
{
    public function __construct(private readonly NotificationService $notificationService)
    {
    }

    public function __invoke(): Response
    {
        $this->notificationService->markAllRead();
        return response()->noContent();
    }
}
