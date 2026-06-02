<?php

namespace App\Console\Commands;

use App\Domains\Referrer\Events\ReferrerOrderCreated;
use App\Domains\Referrer\Models\ReferrerOrder;
use Exception;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class SyncReferrerOrdersWithProvider extends Command
{
    protected $signature = 'referrerOrder:sync-provider
        {--referrer-order= : Sync a single referrer order by id (overrides other filters)}
        {--acceptance= : Only sync referrer orders for this acceptance id}
        {--referrer= : Only sync referrer orders for this referrer id}
        {--status=* : Only sync referrer orders with these statuses (repeatable)}
        {--month-ago=1 : Look back this many months by created_at (ignored when --referrer-order is set)}
        {--all-time : Ignore the --month-ago window and sync every matching referrer order}
        {--dry-run : List what would be synced without dispatching anything}
        {--force : Skip the confirmation prompt}';

    protected $description = 'Sync referrer orders to the provider app. The provider upserts by server_id — existing orders are updated, missing ones are created.';

    public function handle(): int
    {
        $query = ReferrerOrder::query()
            // The webhook is skipped server-side when there is no acceptance, so don't bother with those.
            ->whereNotNull('acceptance_id');

        if ($referrerOrderId = $this->option('referrer-order')) {
            $query->where('id', (int) $referrerOrderId);
            $this->info("Scope: referrer order #{$referrerOrderId}.");
        } else {
            if ($acceptanceId = $this->option('acceptance')) {
                $query->where('acceptance_id', (int) $acceptanceId);
                $this->info("Filter: acceptance #{$acceptanceId}.");
            }

            if ($referrerId = $this->option('referrer')) {
                $query->where('referrer_id', (int) $referrerId);
                $this->info("Filter: referrer #{$referrerId}.");
            }

            $statuses = array_filter((array) $this->option('status'));
            if ($statuses) {
                $query->whereIn('status', $statuses);
                $this->info('Filter: status in [' . implode(', ', $statuses) . '].');
            }

            if (!$this->option('all-time')) {
                $monthsAgo = $this->option('month-ago');
                if (!is_numeric($monthsAgo) || $monthsAgo < 1) {
                    $this->error('--month-ago must be a positive number.');
                    return self::FAILURE;
                }
                $dateFrom = Carbon::now()->subMonths((int) $monthsAgo);
                $query->where('created_at', '>=', $dateFrom);
                $this->info("Scope: referrer orders created on or after {$dateFrom->toDateString()} (last {$monthsAgo} month(s)).");
            } else {
                $this->info('Scope: all time.');
            }
        }

        $total = $query->count();
        $this->info("Found {$total} referrer order(s) to sync.");

        if ($total === 0) {
            return self::SUCCESS;
        }

        if ($this->option('dry-run')) {
            $this->warn('Dry-run: no webhooks will be dispatched.');
        } elseif (!$this->option('force') && !$this->confirm("Dispatch sync webhooks for {$total} referrer order(s)?")) {
            $this->info('Cancelled.');
            return self::SUCCESS;
        }

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $dispatched = 0;
        $errors     = 0;

        $query->chunkById(100, function ($referrerOrders) use (&$dispatched, &$errors, $bar) {
            foreach ($referrerOrders as $referrerOrder) {
                try {
                    if (!$this->option('dry-run')) {
                        // The SendReferrerOrderWebhook listener posts to the provider's
                        // /webhooks/orders/import endpoint, which upserts by server_id:
                        // it updates the order if it already exists, otherwise creates it.
                        ReferrerOrderCreated::dispatch($referrerOrder);
                    }
                    $dispatched++;
                } catch (Exception $e) {
                    $errors++;
                    $this->newLine();
                    $this->error("ReferrerOrder #{$referrerOrder->id}: {$e->getMessage()}");
                }
                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine(2);

        $this->table(['Action', 'Count'], [
            ['Dispatched', $dispatched],
            ['Errors',     $errors],
            ['Total',      $total],
        ]);

        return self::SUCCESS;
    }
}
