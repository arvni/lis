<?php

namespace App\Domains\Reception\Enums;

use Kongulov\Traits\InteractWithEnum;

enum ReportApprovalStatus: string
{
    use InteractWithEnum;

    case PENDING = 'pending';
    case IN_APPROVAL = 'in_approval';
    case APPROVED = 'approved';
    case REJECTED = 'rejected';

}
