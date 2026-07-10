<?php

declare(strict_types=1);

namespace App\Domains\Shared\Events;

use App\Domains\Shared\Enums\ActionType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Events\Dispatchable;

class ActivityLogged
{
    use Dispatchable;

    public function __construct(
        public Model $model,
        public ActionType $action,
    ) {}
}
