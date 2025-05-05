<?php

namespace App\Domains\Reception\Enums;

use Kongulov\Traits\InteractWithEnum;

enum AcceptanceItemStateStatus: string
{
    use InteractWithEnum;

    case REJECTED = 'rejected';
    case FINISHED = 'finished';
    case PROCESSING = 'processing';
    case WAITING = 'waiting';

}
