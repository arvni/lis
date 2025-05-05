<?php

namespace App\Domains\Consultation\Enums;

use Kongulov\Traits\InteractWithEnum;

enum ConsultationStatus: string
{
    use InteractWithEnum;

    case BOOKED = 'booked';
    case WAITING = 'waiting';
    case DONE = 'done';
    case STARTED = 'started';

}
