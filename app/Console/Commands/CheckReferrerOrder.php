<?php

namespace App\Console\Commands;

use App\Domains\Referrer\Models\ReferrerOrder;
use App\Domains\Referrer\Services\ReferrerOrderService;
use Illuminate\Console\Command;

class CheckReferrerOrder extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'referrerOrder:check';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        ReferrerOrder::withoutEvents(function () {
            ReferrerOrder::query()
                ->where("status", "waiting")
                ->chunk(100, function ($referrerOrders) {
                    $service = resolve(ReferrerOrderService::class);
                    foreach ($referrerOrders as $referrerOrder) {
                        $service->checkStatus($referrerOrder);
                    }
                });
        });
    }
}
