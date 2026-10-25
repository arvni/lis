<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Enums;

use Kongulov\Traits\InteractWithEnum;

/** Center actions that arrive through the pre_order_actions inbox. */
enum PreOrderActionType: string
{
    use InteractWithEnum;

    case CREATE = 'create';
    case SUBMIT = 'submit';
    case ANSWER_REQUEST = 'answer_request';
    case UPLOAD_DOCUMENT = 'upload_document';
    case MESSAGE = 'message';
    case REQUEST_HOLD = 'request_hold';
    case RESUME = 'resume';
    case CANCEL = 'cancel';
    case DECIDE_FINANCE = 'decide_finance';
    // Phase 3. Recognised so an early panel gets a clear error instead of an unknown type.
    case ADD_BATCH = 'add_batch';
    case CLOSE_BATCHES = 'close_batches';
}
