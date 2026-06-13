<?php

namespace App\Domains\Reception\Enums;

use Kongulov\Traits\InteractWithEnum;

enum ReportApprovalAction: string
{
    use InteractWithEnum;

    case APPROVED = 'approved';
    case REJECTED = 'rejected';

}
