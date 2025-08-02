<?php

namespace App\Domains\Notification\Enums;

use Kongulov\Traits\InteractWithEnum;

enum WhatsappMessageWritten: string
{
    use InteractWithEnum;

    case TEMPLATE = "template";
    case MANUAL = "manual";

}
