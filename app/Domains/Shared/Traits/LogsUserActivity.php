<?php

namespace App\Domains\Shared\Traits;

use App\Domains\Shared\Enums\ActionType;
use App\Domains\Shared\Events\ActivityLogged;
use Illuminate\Database\Eloquent\Model;

trait LogsUserActivity
{
    protected function logCreated(Model $model): void
    {
        ActivityLogged::dispatch($model, ActionType::CREATE);
    }

    protected function logUpdated(Model $model): void
    {
        ActivityLogged::dispatch($model, ActionType::UPDATE);
    }

    protected function logDeleted(Model $model): void
    {
        ActivityLogged::dispatch($model, ActionType::DELETE);
    }
}
