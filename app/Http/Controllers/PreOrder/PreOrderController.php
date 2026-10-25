<?php

declare(strict_types=1);

namespace App\Http\Controllers\PreOrder;

use App\Domains\PreOrder\Enums\FinanceStatus;
use App\Domains\PreOrder\Enums\PreOrderStage;
use App\Domains\PreOrder\Models\PreOrder;
use App\Domains\PreOrder\Services\PreOrderService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

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

    public function show(Request $request, PreOrder $preOrder): Response
    {
        $this->authorize('view', $preOrder);

        return Inertia::render('PreOrder/Show', [
            'preOrder' => $this->preOrderService->detail($preOrder),
            'canQuote' => (bool) $request->user()?->can('quote', $preOrder),
            'canStartTesting' => (bool) $request->user()?->can('startTesting', $preOrder),
        ]);
    }

    /** The finance desk: every quotation, open ones first. */
    public function finance(Request $request): Response
    {
        $this->authorize('quote', PreOrder::class);
        $requestInputs = $request->only(['filters', 'page', 'pageSize']);
        $quotations = $this->preOrderService->financeDesk([
            ...(array) ($requestInputs['filters'] ?? []),
            'pageSize' => (int) ($requestInputs['pageSize'] ?? 25),
        ]);
        $statuses = array_map(fn (FinanceStatus $s) => ['value' => $s->value, 'label' => $s->label()], FinanceStatus::cases());

        return Inertia::render('PreOrder/Finance', compact('quotations', 'requestInputs', 'statuses'));
    }

    public function document(PreOrder $preOrder, string $hash): BinaryFileResponse
    {
        $this->authorize('view', $preOrder);

        return $this->preOrderService->download($preOrder, $hash);
    }
}
