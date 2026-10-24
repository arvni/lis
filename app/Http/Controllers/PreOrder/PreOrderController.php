<?php

declare(strict_types=1);

namespace App\Http\Controllers\PreOrder;

use App\Domains\PreOrder\Enums\PreOrderStage;
use App\Domains\PreOrder\Models\PreOrder;
use App\Domains\PreOrder\Services\PreOrderService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PreOrderController extends Controller
{
    public function __construct(private readonly PreOrderService $preOrderService) {}

    /** The BION work queue. */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', PreOrder::class);
        $requestInputs = $request->only(['filters', 'page', 'pageSize', 'sort']);
        $filters = (array) ($requestInputs['filters'] ?? []);
        if (($filters['mine'] ?? false) && $request->user()) {
            $filters['assigned_to'] = $request->user()->id;
        }
        $preOrders = $this->preOrderService->queue([
            ...$filters,
            'pageSize' => (int) ($requestInputs['pageSize'] ?? 25),
        ]);
        $stages = array_map(fn (PreOrderStage $s) => ['value' => $s->value, 'label' => $s->label()], PreOrderStage::cases());

        return Inertia::render('PreOrder/Index', compact('preOrders', 'requestInputs', 'stages'));
    }

    public function show(PreOrder $preOrder): Response
    {
        $this->authorize('view', $preOrder);

        return Inertia::render('PreOrder/Show', [
            'preOrder' => $this->preOrderService->detail($preOrder),
        ]);
    }
}
