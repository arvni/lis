<?php

namespace App\Http\Controllers\Billing;

use App\Domains\Billing\DTOs\PaymentDTO;
use App\Domains\Billing\Models\Payment;
use App\Domains\Billing\Requests\StorePaymentRequest;
use App\Domains\Billing\Requests\UpdatePaymentRequest;
use App\Domains\Billing\Services\PaymentService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function __construct(private PaymentService $paymentService)
    {
        $this->middleware("indexProvider")->only("index");
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $this->authorize("viewAny", Payment::class);
        $requestInputs = $request->all();
        $payments = $this->paymentService->listPayments($requestInputs);
        return Inertia::render("Payment/Index", compact("requestInputs", "payments"));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePaymentRequest $request)
    {
        $this->paymentService->storePayment(PaymentDTO::fromRequest($request->validated()));
        return redirect()->back()->with(["success" => true, "status" => "Payment created successfully."]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Payment $payment)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePaymentRequest $request, Payment $payment)
    {
        $this->paymentService->updatePayment($payment, PaymentDTO::fromRequest($request->validated()));
        return redirect()->back()->with(["success" => true, "status" => "Payment updated successfully."]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Payment $payment)
    {
        $this->paymentService->deletePayment($payment);
        return back()->with(["success" => true, "status" => "Payment deleted successfully!"]);
    }
}
