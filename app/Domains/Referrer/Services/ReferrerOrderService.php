<?php

namespace App\Domains\Referrer\Services;

use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Referrer\DTOs\ReferrerOrderDTO;
use App\Domains\Referrer\Models\ReferrerOrder;
use App\Domains\Referrer\Repositories\ReferrerOrderRepository;
use Exception;
use Illuminate\Pagination\LengthAwarePaginator;

class ReferrerOrderService
{
    public function __construct(protected ReferrerOrderRepository $referrerRepository)
    {
    }

    public function listReferrerOrders(array $filters): LengthAwarePaginator
    {
        return $this->referrerRepository->listReferrerOrder($filters);
    }

    public function createReferrerOrder(ReferrerOrderDTO $referrerDTO): ReferrerOrder
    {
        return $this->referrerRepository->createReferrerOrder($referrerDTO->toArray());
    }

    public function updateReferrerOrder(ReferrerOrder $referrerOrder, ReferrerOrderDTO $referrerDTO): ReferrerOrder
    {
        return $this->referrerRepository->updateReferrerOrder($referrerOrder, $referrerDTO->toArray());
    }

    public function updateReferrerOrderStatus(ReferrerOrder $referrerOrder, $status): ReferrerOrder
    {
        return $this->referrerRepository->updateReferrerOrder($referrerOrder, ["status" => $status]);
    }


    public function loadShowRequirementLoaded(ReferrerOrder $referrerOrder): ReferrerOrder
    {
        return $referrerOrder->load([
            "ownedDocuments",
            "patient",
            "referrer",
            "acceptance.samples",
        ]);
    }

    /**
     * @throws Exception
     */
    public function deleteReferrerOrder(ReferrerOrder $referrer): void
    {
        if (!$referrer->acceptance()->exists()) {
            $this->referrerRepository->deleteReferrerOrder($referrer);
        } else {
            throw new Exception("ReferrerOrder has associated acceptances or Orders.");
        }
    }

    public function checkStatus(ReferrerOrder $referrerOrder): void
    {
        $referrerOrder->load("acceptance");
        if ($referrerOrder->acceptance && ($referrerOrder->acceptance?->status == AcceptanceStatus::PROCESSING || $referrerOrder->acceptance?->status == AcceptanceStatus::REPORTED)) {
            $this->referrerRepository->updateReferrerOrder($referrerOrder, ["status" => $referrerOrder->acceptance?->status->value]);
        }
    }
}
