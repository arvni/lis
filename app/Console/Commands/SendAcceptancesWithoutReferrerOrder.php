<?php

namespace App\Console\Commands;

use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Referrer\Jobs\SendAcceptanceWebhook;
use Exception;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class SendAcceptancesWithoutReferrerOrder extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'acceptance:send-without-referrer-order {--month-ago= : Number of months to look back (e.g., --month-ago=5 for last 5 months)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send acceptances that have a referrer but no referrerOrder to the referrer system via webhook';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting to process acceptances without referrer orders...');

        $query = Acceptance::query()
            ->whereNotNull('referrer_id')
            ->whereDoesntHave('referrerOrder')
            ->whereHas('AcceptanceItems', function ($q) {
                $q->where("reportless", false);
            });

        // Apply date filter if --month-ago option is provided
        if ($monthsAgo = $this->option('month-ago')) {
            if (!is_numeric($monthsAgo) || $monthsAgo < 1) {
                $this->error('The --month-ago option must be a positive number');
                return Command::FAILURE;
            }

            $dateFrom = Carbon::now()->subMonths((int)$monthsAgo);
            $query->where('created_at', '>=', $dateFrom);
            $this->info("Filtering acceptances from {$dateFrom->toDateString()} onwards (last {$monthsAgo} month(s))");
        } else {
            $dateFrom = Carbon::now()->subMonth();
            $query->where('created_at', '>=', $dateFrom);
        }

        $totalCount = $query->count();
        $this->info("Found {$totalCount} acceptance(s) to send");

        if ($totalCount === 0) {
            $this->info('No acceptances to send. Exiting.');
            return Command::SUCCESS;
        }

        // Confirm before proceeding
        if (!$this->confirm("Do you want to proceed with sending {$totalCount} acceptance(s) to the referrer system?")) {
            $this->info('Operation cancelled.');
            return Command::SUCCESS;
        }

        $bar = $this->output->createProgressBar($totalCount);
        $bar->start();

        $successCount = 0;
        $errorCount = 0;

        $query->chunk(100, function ($acceptances) use (&$successCount, &$errorCount, $bar) {
            foreach ($acceptances as $acceptance) {
                try {
                    // Dispatch webhook job to send this acceptance
                    SendAcceptanceWebhook::dispatch($acceptance->id);
                    $successCount++;
                } catch (Exception $e) {
                    $errorCount++;
                    $this->error("\nError dispatching webhook for acceptance #{$acceptance->id}: {$e->getMessage()}");
                }
                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine(2);

        // Summary
        $this->info("Processing complete!");
        $this->table(
            ['Status', 'Count'],
            [
                ['Dispatched', $successCount],
                ['Errors', $errorCount],
                ['Total', $totalCount]
            ]
        );

        return Command::SUCCESS;
    }
}
