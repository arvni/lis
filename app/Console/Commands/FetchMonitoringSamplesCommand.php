<?php

namespace App\Console\Commands;

use App\Domains\Monitoring\Jobs\FetchNodeSamplesJob;
use App\Domains\Monitoring\Services\MocreoService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class FetchMonitoringSamplesCommand extends Command
{
    protected $signature   = 'monitoring:fetch-samples';
    protected $description = 'Dispatch a fetch-samples job for every Mocreo sensor node';

    public function __construct(private MocreoService $mocreoService)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        try {
            $nodes = $this->mocreoService->getNodes();

            if (empty($nodes)) {
                $this->warn('No nodes returned from Mocreo API.');
                return self::SUCCESS;
            }

            foreach ($nodes as $node) {
                FetchNodeSamplesJob::dispatch($node['nodeId']);
            }

            $this->info('Dispatched ' . count($nodes) . ' node sample job(s).');
            return self::SUCCESS;
        } catch (\Throwable $e) {
            $this->error('Mocreo API error: ' . $e->getMessage());
            Log::error('monitoring:fetch-samples failed', ['exception' => $e]);
            return self::FAILURE;
        }
    }
}
