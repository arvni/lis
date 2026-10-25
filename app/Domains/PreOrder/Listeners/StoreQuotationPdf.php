<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Listeners;

use App\Domains\PreOrder\Events\QuotationSent;
use App\Domains\PreOrder\Services\PreOrderWorkflow;
use Illuminate\Contracts\Queue\ShouldQueue;

/** Renders the quotation PDF off the request path and files it on the pre-order. */
class StoreQuotationPdf implements ShouldQueue
{
    public int $tries = 3;

    public function __construct(private readonly PreOrderWorkflow $workflow) {}

    public function handle(QuotationSent $event): void
    {
        $this->workflow->attachQuotationPdf($event->quotation);
    }
}
