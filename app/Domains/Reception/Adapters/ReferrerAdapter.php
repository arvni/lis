<?php

declare(strict_types=1);

namespace App\Domains\Reception\Adapters;

use App\Domains\Reception\Models\Patient;
use App\Domains\Referrer\Repositories\ReferrerOrderRepository;
use App\Domains\Referrer\Services\ReferrerOrderService;

/**
 * Adapter that lets the Reception domain hand patient links back to the Referrer
 * domain without manipulating ReferrerOrder payloads directly.
 */
class ReferrerAdapter
{
    public function __construct(
        private readonly ReferrerOrderRepository $referrerOrderRepository,
        private readonly ReferrerOrderService $referrerOrderService,
    ) {}

    /**
     * Attach a patient to a referrer order (matching by reference_id / id_no).
     * No-op when the order cannot be found.
     */
    public function attachPatientToOrder(int $referrerOrderId, Patient $patient, mixed $referenceId, ?string $idNo): void
    {
        $referrerOrder = $this->referrerOrderRepository->findReferrerOrderById($referrerOrderId);

        if (! $referrerOrder) {
            return;
        }

        $this->referrerOrderService->attachServerPatientToOrder($referrerOrder, $patient, $referenceId, $idNo);
    }
}
