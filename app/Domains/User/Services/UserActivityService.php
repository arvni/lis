<?php

namespace App\Domains\User\Services;

use App\Domains\User\Enums\ActivityType;
use App\Domains\User\Models\UserActivity;
use Illuminate\Database\Eloquent\Model;

class UserActivityService
{
    public static function createUserActivity(Model $model, ActivityType $activityType): void
    {
        if (auth()->user()) {
            $userActivity = new UserActivity([
                'activity_type' => $activityType,
                'ip_address' => request()->header('X-Forwarded-For')
                    ?? request()->header('X-Real-IP')
                        ?? request()->ip(),
                'payload' => ["value" => $model->toArray(), "request" => request()->all()],
            ]);
            $userActivity->related()->associate($model);
            $userActivity->user()->associate(auth()->user());
            $userActivity->save();
        }
    }
}
