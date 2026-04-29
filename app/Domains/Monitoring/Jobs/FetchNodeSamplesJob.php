<?php

namespace App\Domains\Monitoring\Jobs;

use App\Domains\Monitoring\Models\MonitoringSample;
use App\Domains\Monitoring\Services\MocreoService;
use App\Domains\Setting\Models\Setting;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class FetchNodeSamplesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public array $backoff = [15, 60, 120];

    public function __construct(
        public readonly string $nodeId,
        public ?int $forceBeginTime = null,
        public ?int $forceEndTime   = null,
    ) {}

    public function handle(MocreoService $mocreoService): void
    {
        $intervalSeconds = $this->intervalSeconds();

        if ($this->forceBeginTime !== null) {
            $beginTime = $this->forceBeginTime;
            $endTime   = $this->forceEndTime ?? now()->timestamp;
        } else {
            $lastSample = MonitoringSample::where('node_id', $this->nodeId)
                ->orderByDesc('sampled_at')
                ->first();

            // Start from the point where the next qualifying sample should begin
            $beginTime = $lastSample
                ? $lastSample->sampled_at->timestamp + $intervalSeconds
                : now()->subSeconds($intervalSeconds)->timestamp;

            // Nothing due yet
            if ($beginTime > now()->timestamp) {
                return;
            }

            $endTime = now()->timestamp;
        }

        // Paginate through the API until a page comes back smaller than the page size
        $pageSize = 200;
        $offset   = 0;
        $samples  = [];

        do {
            $page = $mocreoService->getSamples(
                nodeId:    $this->nodeId,
                limit:     $pageSize,
                offset:    $offset,
                beginTime: $beginTime,
                endTime:   $endTime,
            );
            $samples = array_merge($samples, $page);
            $offset += $pageSize;
        } while (count($page) === $pageSize);

        if (empty($samples)) {
            return;
        }

        // API returns newest-first; process oldest-first so our interval check is sequential
        $samples = array_reverse($samples);

        $lastSavedTimestamp = isset($lastSample) ? ($lastSample->sampled_at->timestamp ?? 0) : 0;
        $saved = 0;

        foreach ($samples as $sample) {
            $sampleTime = $sample['time'] ?? null;
            if (!$sampleTime) continue;

            // Only keep samples that are at least one interval after the previous saved one
            if ($sampleTime < $lastSavedTimestamp + $intervalSeconds) {
                continue;
            }

            MonitoringSample::firstOrCreate(
                ['node_id' => $this->nodeId, 'sampled_at' => \Carbon\Carbon::createFromTimestampUTC($sampleTime)],
                [
                    'temperature' => isset($sample['data']['tm']) ? round($sample['data']['tm'] / 100, 2) : null,
                    'humidity'    => isset($sample['data']['hu']) ? round($sample['data']['hu'] / 100, 2) : null,
                ],
            );

            $lastSavedTimestamp = $sampleTime;
            $saved++;
        }

        if ($saved > 0) {
            Log::info("Monitoring: saved {$saved} sample(s) for node {$this->nodeId}");
        }
    }

    private function intervalSeconds(): int
    {
        $setting = Setting::where('key', 'monitoringSampleInterval')->first();
        $minutes = (int) ($setting?->value['value'] ?? 10);
        return max($minutes, 1) * 60;
    }
}
