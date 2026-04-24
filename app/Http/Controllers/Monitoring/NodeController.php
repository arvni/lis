<?php

namespace App\Http\Controllers\Monitoring;

use App\Domains\Laboratory\Models\Section;
use App\Domains\Monitoring\Jobs\FetchNodeSamplesJob;
use App\Domains\Monitoring\Models\MonitoringNode;
use App\Domains\Monitoring\Services\MocreoService;
use App\Domains\Monitoring\Services\NodeService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NodeController extends Controller
{
    public function __construct(private NodeService $nodeService) {}

    public function index(): Response
    {
        $this->authorize('viewAny', MonitoringNode::class);
        $nodes = $this->nodeService->getNodes();
        return Inertia::render('Monitoring/Nodes/Index', compact('nodes'));
    }

    public function show(string $nodeId, Request $request): Response
    {
        $this->authorize('view', MonitoringNode::class);

        $limit     = $request->integer('limit', 50);
        $offset    = $request->integer('offset', 0);
        $beginTime = $request->integer('beginTime') ?: null;
        $endTime   = $request->integer('endTime')   ?: null;

        $node     = $this->nodeService->getNode($nodeId);
        $samples  = $this->nodeService->getSamples($nodeId, $limit, $offset, $beginTime, $endTime);
        $sections = Section::without('sectionGroup')->active()->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn($s) => ['id' => $s->id, 'name' => $s->name])
            ->values();

        return Inertia::render('Monitoring/Nodes/Show',
            compact('node', 'samples', 'sections', 'limit', 'offset', 'beginTime', 'endTime'));
    }

    public function updateSection(string $nodeId, Request $request): RedirectResponse
    {
        $this->authorize('update', MonitoringNode::class);

        $data = $request->validate([
            'section_id' => 'nullable|exists:sections,id',
            'notes'      => 'nullable|string|max:1000',
        ]);

        $this->nodeService->updateLocalNode($nodeId, $data);
        return back()->with(['success' => true, 'status' => 'Node updated.']);
    }

    public function fetchAll(MocreoService $mocreoService): RedirectResponse
    {
        $this->authorize('viewAny', MonitoringNode::class);

        $nodes = $mocreoService->getNodes();
        foreach ($nodes as $node) {
            FetchNodeSamplesJob::dispatch($node['nodeId']);
        }

        return back()->with(['success' => true, 'status' => 'Fetch queued for ' . count($nodes) . ' node(s).']);
    }

    public function fetchNode(string $nodeId): RedirectResponse
    {
        $this->authorize('view', MonitoringNode::class);

        FetchNodeSamplesJob::dispatch($nodeId);

        return back()->with(['success' => true, 'status' => 'Fetch queued for node ' . $nodeId . '.']);
    }
}
