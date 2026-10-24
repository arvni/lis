<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Domains\PreOrder\Repositories\QuotationRepository;
use App\Domains\PreOrder\Services\PreOrderWorkflow;
use Illuminate\Console\Command;
use Throwable;

/** Daily: quotations the center didn't decide on in time expire, which BION is told about. */
class ExpirePreOrderQuotations extends Command
{
    protected $signature = 'pre-orders:expire-quotations';

    protected $description = 'Expire pre-order quotations past their validity.';

    public function handle(QuotationRepository $quotations, PreOrderWorkflow $workflow): int
    {
        $count = 0;
        foreach ($quotations->overdue() as $quotation) {
            try {
                $workflow->expireQuotation($quotation);
                $count++;
            } catch (Throwable $e) {
                // One bad case must not keep the others from expiring.
                report($e);
            }
        }
        $this->info("Expired $count quotation(s).");

        return self::SUCCESS;
    }
}
