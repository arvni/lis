<?php

namespace App\Http\Controllers\Inventory;

use App\Domains\Document\Models\Document;
use App\Domains\Inventory\Enums\PurchaseRequestStatus;
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
        $canViewAll    = auth()->user()->can('Inventory.PurchaseRequests.View All Purchase Requests');
        $requestInputs = $request->all();
        $requests      = $this->prService->listRequests($requestInputs, $canViewAll);
        $pendingCount  = $this->prService->pendingApprovalCount();
        return Inertia::render('Inventory/PurchaseRequests/Index', compact('requests', 'requestInputs', 'canViewAll', 'pendingCount'));
    }

    public function create(Request $request): Response
    {
        $this->authorize('create', PurchaseRequest::class);

        $defaults = null;
        if ($repeatFrom = $request->integer('repeat_from')) {
            $source = PurchaseRequest::with(['lines.item.defaultUnit', 'lines.unit', 'lines.preferredSupplier'])->find($repeatFrom);
            if ($source) $defaults = $source;
        }

        return Inertia::render('Inventory/PurchaseRequests/Add', [
            'suppliers' => Supplier::active()->get(['id', 'name']),
            'defaults'  => $defaults,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', PurchaseRequest::class);
        $data = $request->validate([
            'urgency'                         => 'required|in:LOW,NORMAL,HIGH,URGENT',
            'notes'                           => 'nullable|string',
            'lines'                           => 'required|array|min:1',
            'lines.*.item_id'                 => 'required|exists:items,id',
            'lines.*.unit_id'                 => 'required|exists:units,id',
            'lines.*.qty'                     => 'required|numeric|min:0.000001',
            'lines.*.preferred_supplier_id'   => 'nullable|exists:suppliers,id',
            'lines.*.estimated_unit_price'    => 'nullable|numeric|min:0',
            'lines.*.cat_no'                  => 'nullable|string',
            'lines.*.brand'                   => 'nullable|string',
            'lines.*.notes'                   => 'nullable|string',
        ]);
        $pr = $this->prService->createRequest($data);
        return redirect()->route('inventory.purchase-requests.show', $pr->id)
            ->with(['success' => true, 'status' => 'Purchase request created.']);
    }

    public function show(PurchaseRequest $purchaseRequest): Response
    {
        $this->authorize('viewAny', PurchaseRequest::class);
        $purchaseRequest->load([
            'requestedBy', 'approvedBy', 'supplier',
            'workflowTemplate',
            'lines.item.defaultUnit', 'lines.unit', 'lines.preferredSupplier',
            'histories.user',
            'comments.user',
            'receipts.transaction', 'receipts.lines.prLine.item', 'receipts.lines.location',
        ]);

        // Load approvals ordered by step sort_order
        $approvals = \App\Domains\Inventory\Models\PurchaseRequestApproval::where('purchase_request_id', $purchaseRequest->id)
            ->join('workflow_steps', 'workflow_steps.id', '=', 'purchase_request_approvals.workflow_step_id')
            ->orderBy('workflow_steps.sort_order')
            ->select('purchase_request_approvals.*')
            ->with(['step', 'step.approverUser', 'actedBy'])
            ->get();

        $poDocument      = $purchaseRequest->po_file      ? Document::find($purchaseRequest->po_file)      : null;
        $paymentDocument = $purchaseRequest->payment_file  ? Document::find($purchaseRequest->payment_file) : null;

        $canActOnWorkflow = $purchaseRequest->workflow_template_id
            && $purchaseRequest->status->value === 'SUBMITTED'
            && $this->workflowService->canAct($purchaseRequest, auth()->user());

        $isRequester = $purchaseRequest->requested_by_user_id === auth()->id();

        $canDirectApprove = !$purchaseRequest->workflow_template_id
            && auth()->user()->can('Inventory.PurchaseRequests.Approve Purchase Request')
            && !$isRequester;
        $wasRejected = $purchaseRequest->histories()->where('event', 'REJECTED')->exists()
            && $purchaseRequest->status->value === 'DRAFT';

        return Inertia::render('Inventory/PurchaseRequests/Show', [
            'purchaseRequest' => $purchaseRequest,
            'approvals'       => $approvals,
            'canActOnWorkflow' => $canActOnWorkflow,
            'canDirectApprove' => $canDirectApprove,
            'isRequester'      => $isRequester,
            'wasRejected'     => $wasRejected,
            'users'           => $canActOnWorkflow
                ? \App\Domains\User\Models\User::where('is_active', true)->orderBy('name')->get(['id', 'name'])
                : [],
            'poDocument'      => $poDocument,
            'paymentDocument' => $paymentDocument,
        ]);
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

    public function update(Request $request, PurchaseRequest $purchaseRequest): RedirectResponse
    {
        $action = $request->input('action');

        if (!$action) {
            $this->authorize('create', PurchaseRequest::class);

            if ($purchaseRequest->status !== PurchaseRequestStatus::DRAFT)
                abort(403, 'Only DRAFT purchase requests can be edited.');

            $data = $request->validate([
                'urgency'                       => 'required|string',
                'notes'                         => 'nullable|string',
                'lines'                         => 'required|array|min:1',
                'lines.*.item_id'               => 'required|exists:items,id',
                'lines.*.unit_id'               => 'required|exists:units,id',
                'lines.*.qty'                   => 'required|numeric|min:0.000001',
                'lines.*.preferred_supplier_id' => 'nullable|exists:suppliers,id',
                'lines.*.estimated_unit_price'  => 'nullable|numeric|min:0',
                'lines.*.cat_no'                => 'nullable|string',
                'lines.*.brand'                 => 'nullable|string',
                'lines.*.notes'                 => 'nullable|string',
            ]);

            $this->prService->updateRequest($purchaseRequest, $data);

            return redirect()->route('inventory.purchase-requests.show', $purchaseRequest->id)
                ->with(['success' => true, 'status' => 'Purchase request updated.']);
        }

        match ($action) {
            'submit'  => $this->prService->submit($purchaseRequest, $request->input('change_notes')),
            'approve' => $this->prService->approve($purchaseRequest),
            default   => abort(400, "Unknown action: {$action}"),
        };
        return back()->with(['success' => true, 'status' => 'Purchase request updated.']);
    }

    public function order(Request $request, PurchaseRequest $purchaseRequest): RedirectResponse
    {
        $this->authorize('create', PurchaseRequest::class);
        $data = $request->validate([
            'po_number'   => 'required|string',
            'supplier_id' => 'required|exists:suppliers,id',
            'po_file'     => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ]);
        $this->prService->order($purchaseRequest, $data['po_number'], $data['supplier_id'] ?? null, $request->file('po_file'));
        return back()->with(['success' => true, 'status' => 'Order confirmed. PO number saved.']);
    }

    public function pay(Request $request, PurchaseRequest $purchaseRequest): RedirectResponse
    {
        $this->authorize('create', PurchaseRequest::class);
        $data = $request->validate([
            'payment_date'      => 'required|date',
            'payment_reference' => 'nullable|string',
            'payment_file'      => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ]);
        $this->prService->recordPayment($purchaseRequest, $data, $request->file('payment_file'));
        return back()->with(['success' => true, 'status' => 'Payment recorded.']);
    }

    public function ship(Request $request, PurchaseRequest $purchaseRequest): RedirectResponse
    {
        $this->authorize('create', PurchaseRequest::class);
        $data = $request->validate([
            'shipment_date'          => 'nullable|date',
            'tracking_number'        => 'nullable|string',
            'expected_delivery_date' => 'nullable|date',
        ]);
        $this->prService->markShipped($purchaseRequest, $data);
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

    public function storeReceipt(Request $request, PurchaseRequest $purchaseRequest): RedirectResponse
    {
        $this->authorize('create', PurchaseRequest::class);
        $data = $request->validate([
            'store_id'                      => 'required|exists:stores,id',
            'notes'                         => 'nullable|string',
            'lines'                         => 'required|array|min:1',
            'lines.*.pr_line_id'            => 'required|exists:purchase_request_lines,id',
            'lines.*.qty'                   => 'required|numeric|min:0.000001',
            'lines.*.lot_number'            => 'nullable|string',
            'lines.*.brand'                 => 'nullable|string',
            'lines.*.cat_no'                => 'nullable|string',
            'lines.*.expiry_date'           => 'nullable|date',
            'lines.*.store_location_id'     => 'nullable|exists:store_locations,id',
            'lines.*.unit_price'            => 'nullable|numeric|min:0',
            'lines.*.barcode'               => 'nullable|string|max:255',
        ]);

        try {
            $this->prService->receiveItems($purchaseRequest, $data);
        } catch (\Throwable $e) {
            return back()->with(['success' => false, 'status' => $e->getMessage()]);
        }

        return redirect()->route('inventory.purchase-requests.show', $purchaseRequest->id)
            ->with(['success' => true, 'status' => 'Items received and stock entry created.']);
    }

    public function setBrands(Request $request, PurchaseRequest $purchaseRequest): RedirectResponse
    {
        $this->authorize('create', PurchaseRequest::class);
        $data = $request->validate([
            'lines'         => 'required|array',
            'lines.*.id'    => 'required|exists:purchase_request_lines,id',
            'lines.*.brand' => 'nullable|string|max:255',
        ]);
        $this->prService->setBrands($purchaseRequest, $data['lines']);
        return back()->with(['success' => true, 'status' => 'Brands updated.']);
    }

    public function bulkApprove(Request $request): RedirectResponse
    {
        $this->authorize('viewAny', PurchaseRequest::class);
        $ids = $request->validate(['ids' => 'required|array', 'ids.*' => 'integer'])['ids'];

        $prs = PurchaseRequest::whereIn('id', $ids)
            ->with(['workflowTemplate', 'requestedBy'])
            ->get()
            ->keyBy('id');

        $approved = 0;
        $skipped  = 0;
        foreach ($ids as $id) {
            $pr = $prs->get($id);
            if (!$pr) continue;
            try {
                $this->workflowService->approveStep($pr, auth()->user());
                $approved++;
            } catch (\Throwable) {
                $skipped++;
            }
        }

        $msg = "Approved {$approved} step(s).";
        if ($skipped) $msg .= " {$skipped} skipped (already acted or not authorised).";
        return back()->with(['success' => true, 'status' => $msg]);
    }

    public function addComment(Request $request, PurchaseRequest $purchaseRequest): RedirectResponse
    {
        $this->authorize('viewAny', PurchaseRequest::class);
        $data = $request->validate(['body' => 'required|string|max:2000']);
        $purchaseRequest->comments()->create([
            'user_id' => auth()->id(),
            'body'    => $data['body'],
        ]);
        return back()->with(['success' => true, 'status' => 'Comment added.']);
    }

    public function recall(PurchaseRequest $purchaseRequest): RedirectResponse
    {
        $this->authorize('viewAny', PurchaseRequest::class);
        try {
            $this->workflowService->recall($purchaseRequest, auth()->user());
        } catch (\Throwable $e) {
            return back()->with(['success' => false, 'status' => $e->getMessage()]);
        }
        return back()->with(['success' => true, 'status' => 'Request recalled and returned to draft.']);
    }

    public function delegateStep(Request $request, PurchaseRequest $purchaseRequest): RedirectResponse
    {
        $this->authorize('viewAny', PurchaseRequest::class);
        $data = $request->validate(['delegate_to_user_id' => 'required|exists:users,id']);
        try {
            $this->workflowService->delegate($purchaseRequest, auth()->user(), $data['delegate_to_user_id']);
        } catch (\Throwable $e) {
            return back()->with(['success' => false, 'status' => $e->getMessage()]);
        }
        return back()->with(['success' => true, 'status' => 'Step delegated successfully.']);
    }

    public function approveStep(Request $request, PurchaseRequest $purchaseRequest): RedirectResponse
    {
        $this->authorize('viewAny', PurchaseRequest::class);
        $notes = $request->input('notes');
        try {
            $this->workflowService->approveStep($purchaseRequest, auth()->user(), $notes);
        } catch (\Throwable $e) {
            return back()->with(['success' => false, 'status' => $e->getMessage()]);
        }
        return back()->with(['success' => true, 'status' => 'Step approved.']);
    }

    public function rejectStep(Request $request, PurchaseRequest $purchaseRequest): RedirectResponse
    {
        $this->authorize('viewAny', PurchaseRequest::class);
        $data = $request->validate(['notes' => 'required|string|max:1000']);
        try {
            $this->workflowService->rejectStep($purchaseRequest, auth()->user(), $data['notes']);
        } catch (\Throwable $e) {
            return back()->with(['success' => false, 'status' => $e->getMessage()]);
        }
        return back()->with(['success' => true, 'status' => 'Step rejected. Request returned to draft.']);
    }

    public function cancel(Request $request, PurchaseRequest $purchaseRequest): RedirectResponse
    {
        $this->authorize('create', PurchaseRequest::class);
        $notes = $request->input('notes');
        try {
            $this->prService->cancel($purchaseRequest, $notes);
        } catch (RuntimeException $e) {
            return back()->with(['success' => false, 'status' => $e->getMessage()]);
        }
        return back()->with(['success' => true, 'status' => 'Purchase request cancelled.']);
    }
}
