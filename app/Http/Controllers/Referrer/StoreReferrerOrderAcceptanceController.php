<?php

namespace App\Http\Controllers\Referrer;

use App\Domains\Billing\DTOs\InvoiceDTO;
use App\Domains\Billing\DTOs\PaymentDTO;
use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Enums\PaymentMethod;
use App\Domains\Billing\Services\InvoiceService;
use App\Domains\Billing\Services\PaymentService;
use App\Domains\Reception\DTOs\AcceptanceDTO;
use App\Domains\Reception\DTOs\AcceptanceItemDTO;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Services\AcceptanceService;
use App\Domains\Reception\Services\AcceptanceItemService;
use App\Domains\Referrer\DTOs\ReferrerOrderDTO;
use App\Domains\Referrer\Models\ReferrerOrder;
use App\Domains\Referrer\Requests\StoreReferrerOrderAcceptanceRequest;
use App\Domains\Referrer\Services\ReferrerOrderService;
use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class StoreReferrerOrderAcceptanceController extends Controller
{
    public function __construct(
        private AcceptanceService     $acceptanceService,
        private AcceptanceItemService $acceptanceItemService,
        private ReferrerOrderService  $referrerOrderService,
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
            0,
            $validated["howReport"] ?? null,
            null,
            $validated["acceptanceItems"],
            AcceptanceStatus::SAMPLING,
            $validated["outPatient"] ?? true,
        );
        $acceptance = $this->acceptanceService->storeAcceptance($acceptanceDto);
        $referrerOrderDto = ReferrerOrderDTO::fromArray($referrerOrder->toArray());
        $referrerOrderDto->acceptanceId = $acceptance->id;
        $this->referrerOrderService->updateReferrerOrder($referrerOrder, $referrerOrderDto);
        return back()->with("success", "your order has been accepted");
    }

    /**
     * Handle pooling mode - add tests to existing acceptance
     */
    private function handlePoolingAcceptance(ReferrerOrder $referrerOrder, array $validated, $user)
    {
        $existingAcceptance = Acceptance::find($validated['existing_acceptance_id']);

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
        $this->addAcceptanceItems($existingAcceptance, $validated['acceptanceItems']);

        // Link referrer order to existing acceptance
        $referrerOrderDto = ReferrerOrderDTO::fromArray($referrerOrder->toArray());
        $referrerOrderDto->acceptanceId = $existingAcceptance->id;
        $this->referrerOrderService->updateReferrerOrder($referrerOrder, $referrerOrderDto);

        return back()->with("success", "Tests added to existing acceptance");
    }

    /**
     * Add new acceptance items to an existing acceptance
     */
    private function addAcceptanceItems(Acceptance $acceptance, array $acceptanceItems): void
    {
        $user = auth()->user();

        // Process tests
        if (isset($acceptanceItems['tests']) && is_array($acceptanceItems['tests'])) {
            foreach ($acceptanceItems['tests'] as $item) {
                if (!isset($item['deleted']) || !$item['deleted']) {
                    $dto = new AcceptanceItemDTO(
                        $acceptance->id,
                        $item['method_test']['id'],
                        $item['price'],
                        $item['discount'] ?? 0,
                        array_merge(
                            ($item['customParameters'] ?? []),
                            Arr::except($item, ['method_test', 'price', 'discount', 'patients', 'timeLine', 'id', 'customParameters', 'sampleless'])
                        ),
                        [Carbon::now()->format("Y-m-d H:i:s") => "Created By " . $user->name . " (Pooling)"],
                        $item['no_sample'] ?? 1,
                        null,
                        null,
                        false,
                        $item['sampleless'] ?? false
                    );
                    $this->acceptanceItemService->storeAcceptanceItem($dto);
                }
            }
        }

        // Process panels
        if (isset($acceptanceItems['panels']) && is_array($acceptanceItems['panels'])) {
            foreach ($acceptanceItems['panels'] as $panelData) {
                if (isset($panelData['acceptanceItems']) && is_array($panelData['acceptanceItems'])) {
                    if (isset($panelData['deleted']) && $panelData['deleted']) {
                        continue;
                    }
                    $panelID = Str::uuid();
                    foreach ($panelData['acceptanceItems'] as $item) {
                        $dto = new AcceptanceItemDTO(
                            $acceptance->id,
                            $item['method_test']['id'],
                            $panelData['price'] / count($panelData['acceptanceItems']),
                            ($panelData['discount'] ?? 0) / count($panelData['acceptanceItems']),
                            array_merge(
                                ($item['customParameters'] ?? []),
                                Arr::except($item, ['method_test', 'price', 'discount', 'patients', 'timeLine', 'id', 'customParameters', 'sampleless'])
                            ),
                            [Carbon::now()->format("Y-m-d H:i:s") => "Created By " . $user->name . " (Pooling)"],
                            $item['no_sample'] ?? 1,
                            null,
                            $panelID,
                            false,
                            $item['sampleless'] ?? false
                        );
                        dd($dto);
                        $this->acceptanceItemService->storeAcceptanceItem($dto);
                    }
                }
            }
        }
    }
}
