<?php

declare(strict_types=1);

namespace App\Http\Controllers\Inventory;

use App\Domains\Inventory\Enums\StockExportRequestStatus;
use App\Domains\Inventory\Models\StockExportRequest;
use App\Domains\Inventory\Models\Store;
use App\Domains\Inventory\Requests\AddCommentRequest;
use App\Domains\Inventory\Requests\ApproveStepRequest;
use App\Domains\Inventory\Requests\BulkApproveExportRequestRequest;
use App\Domains\Inventory\Requests\CancelExportRequestRequest;
use App\Domains\Inventory\Requests\DelegateStepRequest;
use App\Domains\Inventory\Requests\FulfillExportRequestRequest;
use App\Domains\Inventory\Requests\RejectStepRequest;
use App\Domains\Inventory\Requests\StoreStockExportRequestRequest;
use App\Domains\Inventory\Requests\UpdateStockExportRequestRequest;
use App\Domains\Inventory\Services\StockExportRequestService;
use App\Domains\Inventory\Services\StockExportRequestWorkflowService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class StockExportRequestController extends Controller
{
    public function __construct(
        private StockExportRequestService $service,
        private StockExportRequestWorkflowService $workflowService,
    ) {
        $this->middleware('indexProvider')->only('index');
    }

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', StockExportRequest::class);
        $requestInputs = $request->all();
        $requests = $this->service->listRequests($requestInputs);
        $pendingCount = $this->service->pendingApprovalCount();

        return Inertia::render('Inventory/ExportRequests/Index', compact('requests', 'requestInputs', 'pendingCount'));
    }

    public function create(Request $request): Response
    {
        $this->authorize('create', StockExportRequest::class);

        $defaults = null;
        if ($repeatFrom = $request->integer('repeat_from')) {
            $defaults = $this->service->findForRepeat($repeatFrom);
        }

        return Inertia::render('Inventory/ExportRequests/Add', [
            'stores' => Store::active()->get(['id', 'name']),
            'defaults' => $defaults,
        ]);
    }

    public function store(StoreStockExportRequestRequest $request): RedirectResponse
    {
        $this->authorize('create', StockExportRequest::class);
        $exportRequest = $this->service->createRequest($request->validated());

        return redirect()->route('inventory.export-requests.show', $exportRequest->id)
            ->with(['success' => true, 'status' => 'Export request created.']);
    }

    public function show(StockExportRequest $exportRequest): Response
    {
        $this->authorize('viewAny', StockExportRequest::class);

        return Inertia::render('Inventory/ExportRequests/Show',
            $this->service->loadForShow($exportRequest, auth()->user())
        );
    }

    public function edit(StockExportRequest $exportRequest): Response
    {
        $this->authorize('create', StockExportRequest::class);

        if ($exportRequest->status !== StockExportRequestStatus::DRAFT) {
            abort(403, 'Only DRAFT export requests can be edited.');
        }

        $exportRequest->load(['lines.item.defaultUnit', 'lines.item.unitConversions.unit', 'lines.unit', 'store']);

        return Inertia::render('Inventory/ExportRequests/Edit', [
            'exportRequest' => $exportRequest,
            'stores' => Store::active()->get(['id', 'name']),
        ]);
    }

    public function update(UpdateStockExportRequestRequest $request, StockExportRequest $exportRequest): RedirectResponse
    {
        $action = $request->input('action');

        if (! $action) {
            $this->authorize('create', StockExportRequest::class);

            if ($exportRequest->status !== StockExportRequestStatus::DRAFT) {
                abort(403, 'Only DRAFT export requests can be edited.');
            }

            $this->service->updateRequest($exportRequest, $request->validated());

            return redirect()->route('inventory.export-requests.show', $exportRequest->id)
                ->with(['success' => true, 'status' => 'Export request updated.']);
        }

        // Authorize per action: a direct approve needs the approve ability; submitting
        // (and any other draft transition) needs create. Without this the action branch
        // would let any authenticated user approve/submit another user's request.
        // change_notes is unvalidated on action requests (rules() returns []) — cast for strict types.
        $changeNotes = $request->input('change_notes');
        if ($action === 'submit') {
            $this->authorize('create', StockExportRequest::class);
            $this->service->submit($exportRequest, $changeNotes === null ? null : (string) $changeNotes);
        } elseif ($action === 'approve') {
            $this->authorize('approve', $exportRequest);
            $this->service->approve($exportRequest);
        } else {
            abort(400, "Unknown action: {$action}");
        }

        return back()->with(['success' => true, 'status' => 'Export request updated.']);
    }

    public function fulfill(StockExportRequest $exportRequest): Response
    {
        $this->authorize('fulfill', $exportRequest);

        if (! in_array($exportRequest->status, [StockExportRequestStatus::APPROVED, StockExportRequestStatus::PARTIALLY_FULFILLED], true)) {
            abort(403, 'Only approved export requests can be fulfilled.');
        }

        $exportRequest->load(['lines.item.defaultUnit', 'lines.unit', 'store']);

        return Inertia::render('Inventory/ExportRequests/Fulfill', [
            'exportRequest' => $exportRequest,
        ]);
    }

    public function storeFulfillment(FulfillExportRequestRequest $request, StockExportRequest $exportRequest): RedirectResponse
    {
        $this->authorize('fulfill', $exportRequest);

        try {
            $this->service->fulfill($exportRequest, $request->validated());
        } catch (\Throwable $e) {
            return back()->with(['success' => false, 'status' => $e->getMessage()]);
        }

        return redirect()->route('inventory.export-requests.show', $exportRequest->id)
            ->with(['success' => true, 'status' => 'Stock dispatched and export transaction created.']);
    }

    public function bulkApprove(BulkApproveExportRequestRequest $request): RedirectResponse
    {
        $this->authorize('export-requests.bulk-approve');
        $ids = $request->validated()['ids'];

        ['approved' => $approved, 'skipped' => $skipped] = $this->service->bulkApproveSteps($ids, auth()->user());

        $msg = "Approved {$approved} step(s).";
        if ($skipped) {
            $reasons = collect($skipped)->map(fn (string $reason, int $id) => "#{$id}: {$reason}")->implode(' ');
            $msg .= ' '.count($skipped)." skipped — {$reasons}";
        }

        return back()->with(['success' => true, 'status' => $msg]);
    }

    public function addComment(AddCommentRequest $request, StockExportRequest $exportRequest): RedirectResponse
    {
        $this->authorize('viewAny', StockExportRequest::class);
        $this->service->addComment($exportRequest, $request->validated()['body']);

        return back()->with(['success' => true, 'status' => 'Comment added.']);
    }

    public function recall(StockExportRequest $exportRequest): RedirectResponse
    {
        $this->authorize('export-requests.recall', $exportRequest);
        try {
            $this->workflowService->recall($exportRequest, auth()->user());
        } catch (\Throwable $e) {
            return back()->with(['success' => false, 'status' => $e->getMessage()]);
        }

        return back()->with(['success' => true, 'status' => 'Request recalled and returned to draft.']);
    }

    public function delegateStep(DelegateStepRequest $request, StockExportRequest $exportRequest): RedirectResponse
    {
        $this->authorize('export-requests.delegate-step', $exportRequest);
        try {
            $this->workflowService->delegate($exportRequest, auth()->user(), (int) $request->validated()['delegate_to_user_id']);
        } catch (\Throwable $e) {
            return back()->with(['success' => false, 'status' => $e->getMessage()]);
        }

        return back()->with(['success' => true, 'status' => 'Step delegated successfully.']);
    }

    public function approveStep(ApproveStepRequest $request, StockExportRequest $exportRequest): RedirectResponse
    {
        $this->authorize('export-requests.approve-step', $exportRequest);
        $notes = $request->validated('notes');
        try {
            $this->workflowService->approveStep($exportRequest, auth()->user(), $notes);
        } catch (\Throwable $e) {
            return back()->with(['success' => false, 'status' => $e->getMessage()]);
        }

        return back()->with(['success' => true, 'status' => 'Step approved.']);
    }

    public function rejectStep(RejectStepRequest $request, StockExportRequest $exportRequest): RedirectResponse
    {
        $this->authorize('export-requests.reject-step', $exportRequest);
        try {
            $this->workflowService->rejectStep($exportRequest, auth()->user(), $request->validated()['notes']);
        } catch (\Throwable $e) {
            return back()->with(['success' => false, 'status' => $e->getMessage()]);
        }

        return back()->with(['success' => true, 'status' => 'Step rejected. Request returned to draft.']);
    }

    public function cancel(CancelExportRequestRequest $request, StockExportRequest $exportRequest): RedirectResponse
    {
        $this->authorize('create', StockExportRequest::class);
        $notes = $request->validated('notes');
        try {
            $this->service->cancel($exportRequest, $notes);
        } catch (RuntimeException $e) {
            return back()->with(['success' => false, 'status' => $e->getMessage()]);
        }

        return back()->with(['success' => true, 'status' => 'Export request cancelled.']);
    }
}
