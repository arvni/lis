<?php

namespace App\Http\Controllers\Monitoring;

use App\Domains\Laboratory\Models\Section;
use App\Domains\Monitoring\Jobs\FetchNodeSamplesJob;
use App\Domains\Monitoring\Models\MonitoringNode;
use App\Domains\Monitoring\Services\MocreoService;
use App\Domains\Monitoring\Services\NodeService;
use App\Http\Controllers\Controller;
use Carbon\Carbon;
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

        $period    = $request->input('period', 'today');
        $beginTime = $request->integer('beginTime') ?: null;
        $endTime   = $request->integer('endTime')   ?: null;

        // Resolve period to timestamps when no explicit range is provided
        if ($beginTime === null && $endTime === null) {
            [$beginTime, $endTime] = match ($period) {
                'week'  => [Carbon::now()->startOfWeek()->timestamp,  Carbon::now()->endOfWeek()->timestamp],
                'month' => [Carbon::now()->startOfMonth()->timestamp, Carbon::now()->endOfMonth()->timestamp],
                'year'  => [Carbon::now()->startOfYear()->timestamp,  Carbon::now()->endOfYear()->timestamp],
                default => [Carbon::today()->timestamp,               Carbon::today()->endOfDay()->timestamp],
            };
        }

        $limit  = $request->integer('limit', 5000);
        $offset = $request->integer('offset', 0);

        $node     = $this->nodeService->getNode($nodeId);
        $samples  = $this->nodeService->getSamples($nodeId, $limit, $offset, $beginTime, $endTime);
        $sections = Section::without('sectionGroup')->active()->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn($s) => ['id' => $s->id, 'name' => $s->name])
            ->values();

        return Inertia::render('Monitoring/Nodes/Show',
            compact('node', 'samples', 'sections', 'period', 'limit', 'offset', 'beginTime', 'endTime'));
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
            MonitoringNode::updateOrCreate(
                ['node_id' => $node['nodeId']],
                [
                    'name'         => $node['name'] ?? null,
                    'model'        => $node['model'] ?? null,
                    'info'         => $node['info'] ?? null,
                    'onlined'      => $node['onlined'] ?? null,
                    'signal_level' => $node['signalLevel'] ?? null,
                    'battery_level'=> $node['batteryLevel'] ?? null,
                ],
            );
            FetchNodeSamplesJob::dispatch($node['nodeId']);
        }

        return back()->with(['success' => true, 'status' => 'Fetch queued for ' . count($nodes) . ' node(s).']);
    }

    public function fetchNode(string $nodeId, Request $request): RedirectResponse
    {
        $this->authorize('view', MonitoringNode::class);

        $beginTime = $request->integer('begin_time') ?: null;
        $endTime   = $request->integer('end_time')   ?: null;

        if ($beginTime === null) {
            $period = $request->input('period', 'today');
            [$beginTime, $endTime] = match ($period) {
                'week'  => [Carbon::now()->startOfWeek()->timestamp,  Carbon::now()->endOfWeek()->timestamp],
                'month' => [Carbon::now()->startOfMonth()->timestamp, Carbon::now()->endOfMonth()->timestamp],
                'year'  => [Carbon::now()->startOfYear()->timestamp,  Carbon::now()->endOfYear()->timestamp],
                default => [Carbon::today()->timestamp,               Carbon::today()->endOfDay()->timestamp],
            };
        }

        FetchNodeSamplesJob::dispatch($nodeId, $beginTime, $endTime);

        return back()->with(['success' => true, 'status' => 'Fetch queued for node ' . $nodeId . '.']);
    }
}
