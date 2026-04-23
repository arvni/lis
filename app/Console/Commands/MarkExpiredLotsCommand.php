<?php

namespace App\Console\Commands;

use App\Domains\Inventory\Repositories\StockLotRepository;
use Illuminate\Console\Command;

class MarkExpiredLotsCommand extends Command
{
    protected $signature = 'inventory:mark-expired-lots';
    protected $description = 'Mark stock lots as EXPIRED when their expiry date has passed';

    public function __construct(private StockLotRepository $lotRepository)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $count = $this->lotRepository->markExpiredLots();
        $this->info("Marked {$count} lot(s) as EXPIRED.");
        return self::SUCCESS;
    }
}
