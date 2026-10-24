<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Domains\PreOrder\Services\PreOrderInbox;
use Illuminate\Console\Command;

class ProcessPreOrderInbox extends Command
{
    protected $signature = 'pre-orders:process-inbox {--limit=100 : Most actions to handle in one run}';

    protected $description = 'Apply the center actions api wrote to pre_order_actions.';

    public function handle(PreOrderInbox $inbox): int
    {
        $handled = $inbox->processPending((int) $this->option('limit'));
        if ($handled > 0) {
            $this->info("Handled $handled pre-order action(s).");
        }

        return self::SUCCESS;
    }
}
