<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Enums;

use Kongulov\Traits\InteractWithEnum;

enum HistoryType: string
{
    use InteractWithEnum;

    case STAGE = 'stage';
    case EXCEPTION = 'exception';
    case DECISION = 'decision';
    case COMMENT = 'comment';
    case REQUEST = 'request';
    case DOCUMENT = 'document';
    case FINANCE = 'finance';
}
