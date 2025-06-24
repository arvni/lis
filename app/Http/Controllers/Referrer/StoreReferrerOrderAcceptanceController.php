<?php

namespace App\Http\Controllers\Referrer;

use App\Domains\Billing\DTOs\InvoiceDTO;
use App\Domains\Billing\DTOs\PaymentDTO;
use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Enums\PaymentMethod;
use App\Domains\Billing\Services\InvoiceService;
use App\Domains\Billing\Services\PaymentService;
use App\Domains\Reception\DTOs\AcceptanceDTO;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Services\AcceptanceService;
use App\Domains\Referrer\DTOs\ReferrerOrderDTO;
use App\Domains\Referrer\Models\ReferrerOrder;
use App\Domains\Referrer\Requests\StoreReferrerOrderAcceptanceRequest;
use App\Domains\Referrer\Services\ReferrerOrderService;
use App\Http\Controllers\Controller;

class StoreReferrerOrderAcceptanceController extends Controller
{
    public function __construct(
        private AcceptanceService    $acceptanceService,
        private InvoiceService       $invoiceService,
        private PaymentService       $paymentService,
        private ReferrerOrderService $referrerOrderService,
    )
    {
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(ReferrerOrder $referrerOrder, StoreReferrerOrderAcceptanceRequest $request)
    {
        if ($referrerOrder->acceptance_id)
            return back()->withErrors("it has Acceptance Currently");
        $user = auth()->user();
        $validated = $request->validated();
        $invoiceDto = new InvoiceDTO("referrer", $referrerOrder->referrer_id, $user->id);
        $invoice = $this->invoiceService->storeInvoice($invoiceDto);
        $acceptanceDto = new AcceptanceDto(
            $referrerOrder->patient_id,
            5,
            null,
            null,
            $invoice->id,
            $referrerOrder->referrer_id,
            $user->id,
            $referrerOrder->orderInformation["reference_id"] ?? null,
            0,
            $validated["howToOrder"] ?? null,
            null,
            $validated["acceptanceItems"],
            AcceptanceStatus::SAMPLING,
            $validated["outPatient"] ?? true,
        );
        $acceptance = $this->acceptanceService->storeAcceptance($acceptanceDto);
        $acceptance
            ->loadSum("AcceptanceItems", "price")
            ->loadSum("AcceptanceItems", "discount");
        $price = $acceptance->acceptance_items_sum_price - $acceptance->acceptance_items_sum_discount;
        $paymentDto = new PaymentDto($invoice->id, $user->id, "referrer", $referrerOrder->referrer_id, $price, PaymentMethod::CREDIT, null);
        $this->paymentService->storePayment($paymentDto);
        $referrerOrderDto = ReferrerOrderDTO::fromArray($referrerOrder->toArray());
        $referrerOrderDto->acceptanceId = $acceptance->id;
        $this->referrerOrderService->updateReferrerOrder($referrerOrder, $referrerOrderDto);
        return back()->with("success", "your order has been accepted");
    }
}
