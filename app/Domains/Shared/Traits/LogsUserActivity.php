<?php

namespace App\Domains\Shared\Traits;

use App\Domains\User\Enums\ActivityType;
use App\Domains\User\Services\UserActivityService;
use Illuminate\Database\Eloquent\Model;

trait LogsUserActivity
{
    protected function logCreated(Model $model): void
    {
        UserActivityService::createUserActivity($model, ActivityType::CREATE);
    }

    protected function logUpdated(Model $model): void
    {
        UserActivityService::createUserActivity($model, ActivityType::UPDATE);
    }

    protected function logDeleted(Model $model): void
    {
        UserActivityService::createUserActivity($model, ActivityType::DELETE);
    }
}
