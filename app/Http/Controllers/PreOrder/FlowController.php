<?php

declare(strict_types=1);

namespace App\Http\Controllers\PreOrder;

use App\Domains\PreOrder\Adapters\DocumentAdapter;
use App\Domains\PreOrder\Enums\BatchMode;
use App\Domains\PreOrder\Enums\PreOrderStage;
use App\Domains\PreOrder\Exceptions\PreOrderRuleException;
use App\Domains\PreOrder\Models\Flow;
use App\Domains\PreOrder\Repositories\FlowRepository;
use App\Domains\PreOrder\Requests\CopyFlowRequest;
use App\Domains\PreOrder\Requests\PublishFlowRequest;
use App\Domains\PreOrder\Services\FlowVersionService;
use App\Domains\PreOrder\Support\FlowDefinition;
use App\Http\Controllers\Controller;
use Closure;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** The flow builder: BION admins copy, edit and publish the stage flows tests run on. */
class FlowController extends Controller
{
    public function __construct(
        private readonly FlowRepository $flows,
        private readonly FlowVersionService $versions,
    ) {}

    public function index(): Response
    {
        $this->authorize('manage', Flow::class);

        return Inertia::render('PreOrder/Flows/Index', [
            'flows' => $this->flows->listForAdmin()->map(fn (Flow $f) => [
                'id' => $f->id,
                'name' => $f->name,
                'family' => $f->family,
                'version' => $f->version,
                'active' => $f->active,
                'tests_count' => $f->tests_count,
                'open_pre_orders_count' => $f->open_pre_orders_count,
                'updated_at' => $f->updated_at?->toIso8601String(),
            ])->values(),
        ]);
    }

    public function edit(Flow $flow): Response
    {
        $this->authorize('manage', $flow);

        return Inertia::render('PreOrder/Flows/Edit', [
            'flow' => [
                'id' => $flow->id,
                'name' => $flow->name,
                'family' => $flow->family,
                'version' => $flow->version,
                'active' => $flow->active,
                'stages' => FlowDefinition::keyed($flow->stages),
            ],
            'library' => array_map(fn (PreOrderStage $s) => [
                'code' => $s->value,
                'label' => $s->label(),
                'action' => $s->nextAction(),
                'always_on' => $s->isAlwaysOn(),
                'rule' => FlowDefinition::RULES[$s->value] ?? null,
                'read_from_orders' => $s->isReadFromOrders(),
            ], PreOrderStage::cases()),
            'documentTags' => DocumentAdapter::centerTagValues(),
            'batchModes' => array_map(fn (BatchMode $m) => $m->value, BatchMode::cases()),
        ]);
    }

    public function update(PublishFlowRequest $request, Flow $flow): RedirectResponse
    {
        return $this->run(
            fn () => $this->versions->publish($flow, $request->validated('name'), (array) $request->validated('stages')),
            fn () => "Published as version {$flow->version}. Open pre-orders stay on the version they started with.",
        );
    }

    public function copy(CopyFlowRequest $request, Flow $flow): RedirectResponse
    {
        $copy = $this->versions->copy($flow, $request->validated('name'));

        return redirect()->route('pre-orders.flows.edit', $copy)->with(['success' => true, 'status' => 'Copied. Change the stages and publish.']);
    }

    public function setActive(Request $request, Flow $flow): RedirectResponse
    {
        $this->authorize('manage', $flow);
        $active = $request->boolean('active');

        return $this->run(fn () => $this->versions->setActive($flow, $active), $active ? 'Flow switched on.' : 'Flow switched off.');
    }

    private function run(Closure $action, Closure|string $done): RedirectResponse
    {
        try {
            $action();
        } catch (PreOrderRuleException $e) {
            return back()->withErrors(['action' => $e->getMessage()]);
        }

        return back()->with(['success' => true, 'status' => $done instanceof Closure ? $done() : $done]);
    }
}
