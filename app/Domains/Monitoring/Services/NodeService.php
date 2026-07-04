<?php

namespace App\Domains\Monitoring\Services;

use App\Domains\Monitoring\Adapters\LaboratoryAdapter;
use App\Domains\Monitoring\Jobs\FetchNodeSamplesJob;
use App\Domains\Monitoring\Models\MonitoringNode;
use App\Domains\Monitoring\Models\MonitoringSample;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class NodeService
{
    public function __construct(
        private MocreoService $mocreoService,
        private LaboratoryAdapter $laboratoryAdapter,
    ) {}

    /**
     * Active lab sections as lightweight {id, name} options for the node form.
     *
     * @return Collection<int, array{id: int, name: string}>
     */
    public function getSectionsForSelect(): Collection
    {
        return $this->laboratoryAdapter->activeSectionsForSelect();
    }

    /**
     * Pull the node list from the remote service, upsert each node locally, and
     * queue a sample fetch for it. Returns the number of nodes processed.
     */
    public function syncFromRemote(): int
    {
        $nodes = $this->mocreoService->getNodes();

        foreach ($nodes as $node) {
            MonitoringNode::updateOrCreate(
                ['node_id' => $node['nodeId']],
                [
                    'name'          => $node['name'] ?? null,
                    'model'         => $node['model'] ?? null,
                    'info'          => $node['info'] ?? null,
                    'onlined'       => $node['onlined'] ?? null,
                    'signal_level'  => $node['signalLevel'] ?? null,
                    'battery_level' => $node['batteryLevel'] ?? null,
                ],
            );
            FetchNodeSamplesJob::dispatch($node['nodeId']);
        }

        return count($nodes);
    }

    public function getNodes(): array
    {
        return MonitoringNode::with('section')->get()->map(fn($node) => [
            'id'           => $node->id,
            'nodeId'       => $node->node_id,
            'name'         => $node->name,
            'model'        => $node->model,
            'info'         => $node->info,
            'onlined'      => $node->onlined,
            'signalLevel'  => $node->signal_level,
            'batteryLevel' => $node->battery_level,
            'local_id'     => $node->id,
            'section_id'   => $node->section_id,
            'section_name' => $node->section?->name,
            'notes'        => $node->notes,
        ])->values()->toArray();
    }

    public function getNode(string $nodeId): array
    {
        $node = MonitoringNode::with('section')->firstOrCreate(['node_id' => $nodeId]);

        return [
            'id'           => $node->id,
            'nodeId'       => $node->node_id,
            'name'         => $node->name,
            'model'        => $node->model,
            'info'         => $node->info,
            'onlined'      => $node->onlined,
            'signalLevel'  => $node->signal_level,
            'batteryLevel' => $node->battery_level,
            'local_id'     => $node->id,
            'section_id'   => $node->section_id,
            'section_name' => $node->section?->name,
            'notes'        => $node->notes,
        ];
    }

    public function getSamples(
        string $nodeId,
        int    $limit,
        int    $offset,
        ?int   $beginTime,
        ?int   $endTime,
    ): array {
        $query = MonitoringSample::where('node_id', $nodeId)
            ->orderBy('sampled_at');

        if ($beginTime !== null) {
            $query->where('sampled_at', '>=', Carbon::createFromTimestampUTC($beginTime));
        }
        if ($endTime !== null) {
            $query->where('sampled_at', '<=', Carbon::createFromTimestampUTC($endTime));
        }

        return $query->offset($offset)->limit($limit)->get()
            ->map(fn($s) => [
                'time'        => $s->sampled_at->timestamp,
                'temperature' => (float) $s->temperature,
                'humidity'    => $s->humidity !== null ? (float) $s->humidity : null,
            ])->toArray();
    }

    public function updateLocalNode(string $nodeId, array $data): MonitoringNode
    {
        $node = MonitoringNode::firstOrCreate(['node_id' => $nodeId]);
        $node->fill($data)->save();
        return $node->fresh('section');
    }
}
