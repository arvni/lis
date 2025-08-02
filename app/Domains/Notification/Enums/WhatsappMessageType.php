<?php

namespace App\Domains\Notification\Enums;

use Kongulov\Traits\InteractWithEnum;

enum WhatsappMessageType: string
{
    use InteractWithEnum;

    case INBOUND = "inbound";
    case OUTBOUND = "outbound";

}
