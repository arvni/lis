<?php

namespace App\Http\Controllers\Billing;

use App\Domains\Billing\DTOs\InvoiceDTO;
use App\Domains\Billing\Events\InvoiceAcceptanceUpdateEvent;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Requests\StoreInvoiceRequest;
use App\Domains\Billing\Requests\UpdateInvoiceRequest;
use App\Domains\Billing\Services\InvoiceService;
use App\Domains\User\Models\Role;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceController extends Controller
{
    public function __construct(private readonly InvoiceService $invoiceService)
    {
        $this->middleware("indexProvider")->only("index");
    }

    /**
     * Display a listing of the resource.
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize("viewAny", Invoice::class);
        $requestInputs = $request->all();
        $invoices = $this->invoiceService->listInvoices($requestInputs);
        return Inertia::render("Invoice/Index", compact("requestInputs", "invoices"));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreInvoiceRequest $request)
    {

        $invoice = $this->invoiceService
            ->storeInvoice(new InvoiceDTO(
                $request->get("owner_type"),
                $request->get("owner_id"),
                auth()->user()->id,
                $request->get("discount", 0)
            ));
        InvoiceAcceptanceUpdateEvent::dispatch($request->get("acceptance_id"), $invoice->id);
        return redirect()->back()->with(["success" => true, "status" => "Invoice created successfully."]);

    }

    /**
     * Display the specified resource.
     */
    public function show(Invoice $invoice)
    {
        $this->authorize("view", $invoice);
//        $vat = (int)(Setting::where("key", "vat")->first()->value["value"]);
        $this->invoiceService->loadForShow($invoice);
        return Inertia::render("Invoice/Print", [
            "invoice" => $invoice,
//            "vat" => $vat
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Invoice $invoice)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateInvoiceRequest $request, Invoice $invoice)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Invoice $invoice)
    {
        $this->authorize("delete", $invoice);
        $this->invoiceService->deleteInvoice($invoice);
        return redirect()->back()->with(["success" => true, "status" => "Invoice deleted successfully."]);
    }
}
