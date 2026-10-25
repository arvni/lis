<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Events;

use App\Domains\PreOrder\Models\PreOrder;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/** A pre-order sat in its stage past the flow's reminder or escalation delay. */
class PreOrderReminderDue
{
    use Dispatchable, SerializesModels;

    public function __construct(public PreOrder $preOrder, public bool $escalation) {}
}
