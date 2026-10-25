<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Events;

use App\Domains\PreOrder\Models\PreOrderQuotation;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/** The center decided on a quotation, or it expired. */
class QuotationDecided
{
    use Dispatchable, SerializesModels;

    public function __construct(public PreOrderQuotation $quotation) {}
}
