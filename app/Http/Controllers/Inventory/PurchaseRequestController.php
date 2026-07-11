<?php

declare(strict_types=1);

namespace App\Http\Controllers\Inventory;

use App\Domains\Inventory\Enums\PurchaseRequestStatus;
use App\Domains\Inventory\Requests\AddCommentRequest;
use App\Domains\Inventory\Requests\ApproveStepRequest;
use App\Domains\Inventory\Requests\CancelPurchaseRequestRequest;
use App\Domains\Inventory\Requests\BulkApprovePurchaseRequestRequest;
use App\Domains\Inventory\Requests\DelegateStepRequest;
use App\Domains\Inventory\Requests\OrderPurchaseRequestRequest;
use App\Domains\Inventory\Requests\PayPurchaseRequestRequest;
use App\Domains\Inventory\Requests\RejectStepRequest;
use App\Domains\Inventory\Requests\SetBrandsRequest;
use App\Domains\Inventory\Requests\ShipPurchaseRequestRequest;
use App\Domains\Inventory\Requests\StorePurchaseRequestRequest;
use App\Domains\Inventory\Requests\StoreReceiptRequest;
use App\Domains\Inventory\Requests\UpdatePurchaseRequestRequest;
use App\Domains\Inventory\Models\PurchaseRequest;
use App\Domains\Inventory\Models\Store;
use App\Domains\Inventory\Models\Supplier;
use App\Domains\Inventory\Services\PurchaseRequestService;
use App\Domains\Inventory\Services\PurchaseRequestWorkflowService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class PurchaseRequestController extends Controller
{
    public function __construct(
        private PurchaseRequestService $prService,
        private PurchaseRequestWorkflowService $workflowService,
    ) {
        $this->middleware('indexProvider')->only('index');
    }

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', PurchaseRequest::class);
        $requestInputs = $request->all();
        $requests      = $this->prService->listRequests($requestInputs);
        $pendingCount  = $this->prService->pendingApprovalCount();
        return Inertia::render('Inventory/PurchaseRequests/Index', compact('requests', 'requestInputs', 'pendingCount'));
    }

    public function create(Request $request): Response
    {
        $this->authorize('create', PurchaseRequest::class);

        $defaults = null;
        if ($repeatFrom = $request->integer('repeat_from')) {
            $defaults = $this->prService->findForRepeat($repeatFrom);
        }

        return Inertia::render('Inventory/PurchaseRequests/Add', [
            'suppliers' => Supplier::active()->get(['id', 'name']),
            'defaults'  => $defaults,
        ]);
    }

    public function store(StorePurchaseRequestRequest $request): RedirectResponse
    {
        $this->authorize('create', PurchaseRequest::class);
        $pr = $this->prService->createRequest($request->validated());
        return redirect()->route('inventory.purchase-requests.show', $pr->id)
            ->with(['success' => true, 'status' => 'Purchase request created.']);
    }

    public function show(PurchaseRequest $purchaseRequest): Response
    {
        $this->authorize('viewAny', PurchaseRequest::class);
        return Inertia::render('Inventory/PurchaseRequests/Show',
            $this->prService->loadForShow($purchaseRequest, auth()->user())
        );
    }

    public function edit(PurchaseRequest $purchaseRequest): Response
    {
        $this->authorize('create', PurchaseRequest::class);

        if ($purchaseRequest->status !== PurchaseRequestStatus::DRAFT)
            abort(403, 'Only DRAFT purchase requests can be edited.');

        $purchaseRequest->load(['lines.item.defaultUnit', 'lines.item.unitConversions.unit', 'lines.unit', 'lines.preferredSupplier']);

        return Inertia::render('Inventory/PurchaseRequests/Edit', [
            'purchaseRequest' => $purchaseRequest,
        ]);
    }

    public function update(UpdatePurchaseRequestRequest $request, PurchaseRequest $purchaseRequest): RedirectResponse
    {
        $action = $request->input('action');

        if (!$action) {
            $this->authorize('create', PurchaseRequest::class);

            if ($purchaseRequest->status !== PurchaseRequestStatus::DRAFT)
                abort(403, 'Only DRAFT purchase requests can be edited.');

            $this->prService->updateRequest($purchaseRequest, $request->validated());

            return redirect()->route('inventory.purchase-requests.show', $purchaseRequest->id)
                ->with(['success' => true, 'status' => 'Purchase request updated.']);
        }

        // change_notes is unvalidated on action requests (rules() returns []) — cast for strict types
        $changeNotes = $request->input('change_notes');
        match ($action) {
            'submit'  => $this->prService->submit($purchaseRequest, $changeNotes === null ? null : (string) $changeNotes),
            'approve' => $this->prService->approve($purchaseRequest),
            default   => abort(400, "Unknown action: {$action}"),
        };
        return back()->with(['success' => true, 'status' => 'Purchase request updated.']);
    }

    public function order(OrderPurchaseRequestRequest $request, PurchaseRequest $purchaseRequest): RedirectResponse
    {
        $this->authorize('order', $purchaseRequest);
        $data = $request->validated();
        $this->prService->order($purchaseRequest, $data['po_number'], isset($data['supplier_id']) ? (int) $data['supplier_id'] : null, $request->file('po_file'));
        return back()->with(['success' => true, 'status' => 'Order confirmed. PO number saved.']);
    }

    public function pay(PayPurchaseRequestRequest $request, PurchaseRequest $purchaseRequest): RedirectResponse
    {
        $this->authorize('pay', $purchaseRequest);
        $this->prService->recordPayment($purchaseRequest, $request->validated(), $request->file('payment_file'));
        return back()->with(['success' => true, 'status' => 'Payment recorded.']);
    }

    public function ship(ShipPurchaseRequestRequest $request, PurchaseRequest $purchaseRequest): RedirectResponse
    {
        $this->authorize('ship', $purchaseRequest);
        $this->prService->markShipped($purchaseRequest, $request->validated());
        return back()->with(['success' => true, 'status' => 'Marked as shipped.']);
    }

    public function receiveItems(PurchaseRequest $purchaseRequest): Response
    {
        $this->authorize('create', PurchaseRequest::class);
        $purchaseRequest->load(['lines.item.defaultUnit', 'lines.unit']);
        return Inertia::render('Inventory/PurchaseRequests/ReceiveItems', [
            'purchaseRequest' => $purchaseRequest,
            'stores'          => Store::active()->get(['id', 'name']),
        ]);
    }

    public function storeReceipt(StoreReceiptRequest $request, PurchaseRequest $purchaseRequest): RedirectResponse
    {
        $this->authorize('create', PurchaseRequest::class);

        try {
            $this->prService->receiveItems($purchaseRequest, $request->validated());
        } catch (\Throwable $e) {
            return back()->with(['success' => false, 'status' => $e->getMessage()]);
        }

        return redirect()->route('inventory.purchase-requests.show', $purchaseRequest->id)
            ->with(['success' => true, 'status' => 'Items received and stock entry created.']);
    }

    public function setBrands(SetBrandsRequest $request, PurchaseRequest $purchaseRequest): RedirectResponse
    {
        $this->authorize('create', PurchaseRequest::class);
        $this->prService->setBrands($purchaseRequest, $request->validated()['lines']);
        return back()->with(['success' => true, 'status' => 'Brands updated.']);
    }

    public function bulkApprove(BulkApprovePurchaseRequestRequest $request): RedirectResponse
    {
        $this->authorize('purchase-requests.bulk-approve');
        $ids = $request->validated()['ids'];

        ['approved' => $approved, 'skipped' => $skipped] = $this->prService->bulkApproveSteps($ids, auth()->user());

        $msg = "Approved {$approved} step(s).";
        if ($skipped) {
            $reasons = collect($skipped)->map(fn (string $reason, int $id) => "#{$id}: {$reason}")->implode(' ');
            $msg .= ' '.count($skipped)." skipped — {$reasons}";
        }
        return back()->with(['success' => true, 'status' => $msg]);
    }

    public function addComment(AddCommentRequest $request, PurchaseRequest $purchaseRequest): RedirectResponse
    {
        $this->authorize('viewAny', PurchaseRequest::class);
        $this->prService->addComment($purchaseRequest, $request->validated()['body']);
        return back()->with(['success' => true, 'status' => 'Comment added.']);
    }

    public function recall(PurchaseRequest $purchaseRequest): RedirectResponse
    {
        $this->authorize('purchase-requests.recall', $purchaseRequest);
        try {
            $this->workflowService->recall($purchaseRequest, auth()->user());
        } catch (\Throwable $e) {
            return back()->with(['success' => false, 'status' => $e->getMessage()]);
        }
        return back()->with(['success' => true, 'status' => 'Request recalled and returned to draft.']);
    }

    public function delegateStep(DelegateStepRequest $request, PurchaseRequest $purchaseRequest): RedirectResponse
    {
        $this->authorize('purchase-requests.delegate-step', $purchaseRequest);
        try {
            $this->workflowService->delegate($purchaseRequest, auth()->user(), (int) $request->validated()['delegate_to_user_id']);
        } catch (\Throwable $e) {
            return back()->with(['success' => false, 'status' => $e->getMessage()]);
        }
        return back()->with(['success' => true, 'status' => 'Step delegated successfully.']);
    }

    public function approveStep(ApproveStepRequest $request, PurchaseRequest $purchaseRequest): RedirectResponse
    {
        $this->authorize('purchase-requests.approve-step', $purchaseRequest);
        $notes = $request->validated('notes');
        try {
            $this->workflowService->approveStep($purchaseRequest, auth()->user(), $notes);
        } catch (\Throwable $e) {
            return back()->with(['success' => false, 'status' => $e->getMessage()]);
        }
        return back()->with(['success' => true, 'status' => 'Step approved.']);
    }

    public function rejectStep(RejectStepRequest $request, PurchaseRequest $purchaseRequest): RedirectResponse
    {
        $this->authorize('purchase-requests.reject-step', $purchaseRequest);
        try {
            $this->workflowService->rejectStep($purchaseRequest, auth()->user(), $request->validated()['notes']);
        } catch (\Throwable $e) {
            return back()->with(['success' => false, 'status' => $e->getMessage()]);
        }
        return back()->with(['success' => true, 'status' => 'Step rejected. Request returned to draft.']);
    }

    public function matchTemplate(PurchaseRequest $purchaseRequest): \Illuminate\Http\JsonResponse
    {
        $this->authorize('viewAny', PurchaseRequest::class);

        return response()->json($this->prService->evaluateTemplates($purchaseRequest));
    }

    public function cancel(CancelPurchaseRequestRequest $request, PurchaseRequest $purchaseRequest): RedirectResponse
    {
        $this->authorize('create', PurchaseRequest::class);
        $notes = $request->validated('notes');
        try {
            $this->prService->cancel($purchaseRequest, $notes);
        } catch (RuntimeException $e) {
            return back()->with(['success' => false, 'status' => $e->getMessage()]);
        }
        return back()->with(['success' => true, 'status' => 'Purchase request cancelled.']);
    }
}
