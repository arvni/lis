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

    public function __construct(public readonly string $nodeId) {}

    public function handle(MocreoService $mocreoService): void
    {
        $intervalSeconds = $this->intervalSeconds();

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

        $samples = $mocreoService->getSamples(
            nodeId:    $this->nodeId,
            limit:     200,
            offset:    0,
            beginTime: $beginTime,
            endTime:   now()->timestamp,
        );

        if (empty($samples)) {
            return;
        }

        // API returns newest-first; process oldest-first so our interval check is sequential
        $samples = array_reverse($samples);

        $lastSavedTimestamp = $lastSample?->sampled_at?->timestamp ?? 0;
        $saved = 0;

        foreach ($samples as $sample) {
            $sampleTime = $sample['time'] ?? null;
            if (!$sampleTime) continue;

            // Only keep samples that are at least one interval after the previous saved one
            if ($sampleTime < $lastSavedTimestamp + $intervalSeconds) {
                continue;
            }

            MonitoringSample::firstOrCreate(
                ['node_id' => $this->nodeId, 'sampled_at' => \Carbon\Carbon::createFromTimestamp($sampleTime)],
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
