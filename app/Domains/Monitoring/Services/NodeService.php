<?php

namespace App\Domains\Monitoring\Services;

use App\Domains\Monitoring\Models\MonitoringNode;

class NodeService
{
    public function __construct(private MocreoService $mocreoService) {}

    public function getNodes(): array
    {
        $apiNodes = $this->mocreoService->getNodes();
        $local    = MonitoringNode::with('section')->get()->keyBy('node_id');

        return collect($apiNodes)->map(fn($n) => array_merge($n, [
            'id'           => $n['nodeId'],
            'local_id'     => $local->get($n['nodeId'])?->id,
            'section_id'   => $local->get($n['nodeId'])?->section_id,
            'section_name' => $local->get($n['nodeId'])?->section?->name,
            'notes'        => $local->get($n['nodeId'])?->notes,
        ]))->values()->toArray();
    }

    public function getNode(string $nodeId): array
    {
        $apiNode = $this->mocreoService->getNode($nodeId);
        $local   = MonitoringNode::with('section')->firstOrCreate(['node_id' => $nodeId]);

        return array_merge($apiNode, [
            'local_id'     => $local->id,
            'section_id'   => $local->section_id,
            'section_name' => $local->section?->name,
            'notes'        => $local->notes,
        ]);
    }

    public function getSamples(
        string $nodeId,
        int    $limit,
        int    $offset,
        ?int   $beginTime,
        ?int   $endTime,
    ): array {
        return $this->mocreoService->getSamples($nodeId, $limit, $offset, $beginTime, $endTime);
    }

    public function updateLocalNode(string $nodeId, array $data): MonitoringNode
    {
        $node = MonitoringNode::firstOrCreate(['node_id' => $nodeId]);
        $node->fill($data)->save();
        return $node->fresh('section');
    }
}
