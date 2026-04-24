<?php

namespace App\Http\Controllers\Monitoring;

use App\Domains\Monitoring\Exports\NodeSamplesExport;
use App\Domains\Monitoring\Models\MonitoringNode;
use App\Domains\Monitoring\Services\NodeService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class NodeSamplesExportController extends Controller
{
    public function __construct(private NodeService $nodeService) {}

    public function __invoke(string $nodeId, Request $request): BinaryFileResponse
    {
        $this->authorize('view', MonitoringNode::class);

        $limit     = $request->integer('limit', 5000);
        $offset    = $request->integer('offset', 0);
        $beginTime = $request->integer('beginTime') ?: null;
        $endTime   = $request->integer('endTime')   ?: null;

        $node    = $this->nodeService->getNode($nodeId);
        $samples = $this->nodeService->getSamples($nodeId, $limit, $offset, $beginTime, $endTime);

        $hasHumidity = !empty($node['info']['humidity'])
            || collect($samples)->contains(fn($s) => isset($s['data']['hu']));

        $nodeName = $node['name'] ?? $nodeId;
        $filename = str($nodeName)->slug('-') . '-samples-' . now()->format('Ymd-His') . '.xlsx';

        return Excel::download(
            new NodeSamplesExport($samples, $nodeName, $hasHumidity),
            $filename,
        );
    }
}
