<?php

declare(strict_types=1);

namespace App\Domains\User\Listeners;

use App\Domains\Shared\Enums\ActionType;
use App\Domains\Shared\Events\ActivityLogged;
use App\Domains\User\Enums\ActivityType;
use App\Domains\User\Services\UserActivityService;

class LogUserActivityListener
{
    public function handle(ActivityLogged $event): void
    {
        $activityType = match ($event->action) {
            ActionType::CREATE => ActivityType::CREATE,
            ActionType::UPDATE => ActivityType::UPDATE,
            ActionType::DELETE => ActivityType::DELETE,
        };

        UserActivityService::createUserActivity($event->model, $activityType);
    }
}
