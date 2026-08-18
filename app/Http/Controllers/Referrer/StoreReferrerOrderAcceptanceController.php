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
use App\Domains\Reception\Services\AcceptanceItemService;
use App\Domains\Referrer\Adapters\ReceptionAdapter;
use App\Domains\Referrer\Models\ReferrerOrder;
use App\Domains\Referrer\Requests\StoreReferrerOrderAcceptanceRequest;
use App\Domains\Referrer\Services\ReferrerOrderService;
use App\Domains\User\Models\User;
use App\Http\Controllers\Controller;

class StoreReferrerOrderAcceptanceController extends Controller
{
    public function __construct(
        private AcceptanceService     $acceptanceService,
        private AcceptanceItemService $acceptanceItemService,
        private ReferrerOrderService  $referrerOrderService,
        private ReceptionAdapter      $receptionAdapter,
    )
    {
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(ReferrerOrder $referrerOrder, StoreReferrerOrderAcceptanceRequest $request): \Illuminate\Http\RedirectResponse
    {
        if ($referrerOrder->acceptance_id)
            return back()->withErrors("it has Acceptance Currently");

        $user = auth()->user();
        $validated = $request->validated();

        // Check if pooling mode with existing acceptance
        if ($referrerOrder->pooling && isset($validated['existing_acceptance_id'])) {
            return $this->handlePoolingAcceptance($referrerOrder, $validated, $user);
        }

        $acceptanceDto = new AcceptanceDto(
            $referrerOrder->patient_id,
            5,
            null,
            null,
            null,
            $referrerOrder->referrer_id,
            $user->id,
            $referrerOrder->orderInformation["reference_id"] ?? null,
            "0",
            $validated["howReport"] ?? null,
            null,
            $validated["acceptanceItems"],
            AcceptanceStatus::SAMPLING,
            $validated["outPatient"] ?? true,
            null,
            (bool) $referrerOrder->pooling,
        );
        $acceptance = $this->acceptanceService->storeAcceptance($acceptanceDto);
        $this->referrerOrderService->linkToAcceptance($referrerOrder, $acceptance);
        return back()->with("success", "your order has been accepted");
    }

    /**
     * Handle pooling mode - add tests to existing acceptance
     */
    private function handlePoolingAcceptance(ReferrerOrder $referrerOrder, array $validated, User $user): \Illuminate\Http\RedirectResponse
    {
        $existingAcceptance = $this->receptionAdapter->findAcceptance((int) $validated['existing_acceptance_id']);

        if (!$existingAcceptance) {
            return back()->withErrors("Selected acceptance not found");
        }

        // Validate acceptance belongs to same patient and referrer
        if ($existingAcceptance->patient_id !== $referrerOrder->patient_id) {
            return back()->withErrors("Selected acceptance belongs to a different patient");
        }

        if ($existingAcceptance->referrer_id !== $referrerOrder->referrer_id) {
            return back()->withErrors("Selected acceptance belongs to a different referrer");
        }

        // Add new acceptance items directly to existing acceptance
        $this->acceptanceItemService->addItemsToExistingAcceptance(
            $existingAcceptance,
            $validated['acceptanceItems']
        );

        // Link referrer order to existing acceptance
        $this->referrerOrderService->linkToAcceptance($referrerOrder, $existingAcceptance);

        return back()->with("success", "Tests added to existing acceptance");
    }
}
