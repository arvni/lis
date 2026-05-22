<?php

namespace Database\Seeders;

use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Services\InvoiceComposer;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Throwable;

class BackfillInvoiceItemsSeeder extends Seeder
{
    /**
     * Recompose invoice_items for every existing invoice from current acceptance_items,
     * then lock rows belonging to invoices that should not change anymore
     * (paid, credit-paid, canceled, or attached to a statement).
     */
    public function run(InvoiceComposer $composer): void
    {
        $total = Invoice::query()->count();
        $this->command->info("Backfilling invoice_items for {$total} invoices.");

        $processed = 0;
        $failed = 0;

        Invoice::query()
            ->orderBy('id')
            ->chunkById(200, function ($invoices) use ($composer, &$processed, &$failed) {
                foreach ($invoices as $invoice) {
                    try {
                        DB::transaction(function () use ($composer, $invoice) {
                            $composer->recompose($invoice, force: true);
                            if ($this->shouldLock($invoice)) {
                                $composer->lock($invoice);
                            }
                        });
                        $processed++;
                    } catch (Throwable $e) {
                        $failed++;
                        $this->command->warn("Invoice #{$invoice->id} failed: {$e->getMessage()}");
                    }
                }
                $this->command->info("  processed {$processed}, failed {$failed}");
            });

        $this->command->info("Done. Processed {$processed}, failed {$failed}.");
    }

    private function shouldLock(Invoice $invoice): bool
    {
        if ($invoice->statement_id) {
            return true;
        }
        return in_array($invoice->status, [
            InvoiceStatus::PAID,
            InvoiceStatus::CREDIT_PAID,
            InvoiceStatus::CANCELED,
        ], true);
    }
}
