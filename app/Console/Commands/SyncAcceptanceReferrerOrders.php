<?php

namespace App\Console\Commands;

use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Referrer\Services\ReferrerOrderService;
use Exception;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class SyncAcceptanceReferrerOrders extends Command
{
    protected $signature = 'acceptance:sync-referrer-orders
        {--acceptance= : Sync a single acceptance by id (overrides --month-ago)}
        {--month-ago=1 : Number of months to look back (default 1)}
        {--missing-only : Only create ROs for acceptances that have none}
        {--existing-only : Only re-sync acceptances that already have ROs}
        {--not-reported : Only process acceptances whose status is not REPORTED or CANCELLED}
        {--dry-run : List what would happen without dispatching}
        {--force : Skip confirmation prompt}';

    protected $description = 'Reconcile acceptances with their referrer orders — dispatches update webhooks for existing ROs and creates ROs for acceptances that have none.';

    public function handle(ReferrerOrderService $service): int
    {
        if ($this->option('missing-only') && $this->option('existing-only')) {
            $this->error('--missing-only and --existing-only are mutually exclusive.');
            return self::FAILURE;
        }

        $query = Acceptance::query()
            ->whereNotNull('referrer_id')
            ->whereHas('acceptanceItems', fn($q) => $q->where('reportless', false));

        if ($acceptanceId = $this->option('acceptance')) {
            $query->where('id', (int) $acceptanceId);
        } else {
            $monthsAgo = $this->option('month-ago');
            if (!is_numeric($monthsAgo) || $monthsAgo < 1) {
                $this->error('--month-ago must be a positive number.');
                return self::FAILURE;
            }
            $dateFrom = Carbon::now()->subMonths((int) $monthsAgo);
            $query->where('created_at', '>=', $dateFrom);
            $this->info("Scope: acceptances created on or after {$dateFrom->toDateString()} (last {$monthsAgo} month(s)).");
        }

        if ($this->option('missing-only')) {
            $query->whereDoesntHave('referrerOrders');
            $this->info('Mode: missing-only — will create ROs for acceptances with none.');
        } elseif ($this->option('existing-only')) {
            $query->whereHas('referrerOrders');
            $this->info('Mode: existing-only — will re-dispatch update webhooks for existing ROs.');
        } else {
            $this->info('Mode: both — create where missing, re-sync where present.');
        }

        if ($this->option('not-reported')) {
            $query->whereNotIn('status', [
                AcceptanceStatus::REPORTED->value,
                AcceptanceStatus::CANCELLED->value,
            ]);
            $this->info('Filter: not-reported — excluding REPORTED and CANCELLED acceptances.');
        }

        $total = $query->count();
        $this->info("Found {$total} acceptance(s) to process.");

        if ($total === 0) {
            return self::SUCCESS;
        }

        if ($this->option('dry-run')) {
            $this->warn('Dry-run: no events will be dispatched.');
        } elseif (!$this->option('force') && !$this->confirm("Proceed with syncing {$total} acceptance(s)?")) {
            $this->info('Cancelled.');
            return self::SUCCESS;
        }

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $created = 0;
        $updated = 0;
        $skipped = 0;
        $errors  = 0;

        $query->chunkById(100, function ($acceptances) use ($service, &$created, &$updated, &$skipped, &$errors, $bar) {
            foreach ($acceptances as $acceptance) {
                try {
                    if ($this->option('dry-run')) {
                        $existing = $acceptance->referrerOrders()->count();
                        $existing > 0 ? $updated += $existing : $created++;
                    } else {
                        $result = $service->syncOrCreateForAcceptance($acceptance);
                        match ($result['action']) {
                            'created' => $created += $result['count'],
                            'updated' => $updated += $result['count'],
                            default   => $skipped++,
                        };
                    }
                } catch (Exception $e) {
                    $errors++;
                    $this->newLine();
                    $this->error("Acceptance #{$acceptance->id}: {$e->getMessage()}");
                }
                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine(2);

        $this->table(['Action', 'Count'], [
            ['Created',  $created],
            ['Updated',  $updated],
            ['Skipped',  $skipped],
            ['Errors',   $errors],
            ['Total',    $total],
        ]);

        return self::SUCCESS;
    }
}
