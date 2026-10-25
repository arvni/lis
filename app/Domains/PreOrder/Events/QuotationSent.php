<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Events;

use App\Domains\PreOrder\Models\PreOrderQuotation;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/** A quotation went to the center; its PDF is made after the change is committed. */
class QuotationSent
{
    use Dispatchable, SerializesModels;

    public function __construct(public PreOrderQuotation $quotation) {}
}
