<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Enums;

use Kongulov\Traits\InteractWithEnum;

/** How a flow's later sample batches reach the lab, set on its "Waiting for samples" stage. */
enum BatchMode: string
{
    use InteractWithEnum;

    /** Each batch is its own order, reported on its own (PGT: one per embryo cycle). */
    case PER_BATCH = 'per_batch';
    /** Every batch adds samples to the first order, which the lab holds until pooling ends. */
    case POOLED = 'pooled';
    /** Later family members' samples join the first order (exome trio, carrier couple). */
    case JOIN = 'join';

    /** A batch in this mode becomes its own order. */
    public function opensOrder(): bool
    {
        return $this === self::PER_BATCH;
    }
}
