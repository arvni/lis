<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Enums;

use Kongulov\Traits\InteractWithEnum;

enum RequestType: string
{
    use InteractWithEnum;

    case INFORMATION = 'information';
    case SAMPLES = 'samples';
    case TEST = 'test';
}
