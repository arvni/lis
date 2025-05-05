<?php

namespace App\Domains\Referrer\Services;

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

    public function getReferrerOrderDetails(ReferrerOrder $referrer): array
    {
        $referrer->load([
            "invoices" => function ($query) {
                $query->latest()->limit(5);
            },
            "payments" => function ($query) {
                $query->latest()->limit(5);
            },
            "acceptances" => function ($query) {
                $query->latest()->limit(5);
            },
            "referrerOrders" => function ($query) {
                $query->latest()->limit(5);
            },
        ]);
        return [
            "referrer"=>$referrer,
            "referrerOrders" => $referrer->referrerOrders,
            "invoices" => $referrer->invoices,
            "payments" => $referrer->payments,
            "acceptances" => $referrer->acceptances,
        ];
    }

    public function loadShowRequirementLoaded(ReferrerOrder $referrerOrder): ReferrerOrder
    {
        return $referrerOrder->load(["OwnedDocuments", "Patient", "Referrer","Acceptance.Samples"]);
    }

    /**
     * @throws Exception
     */
    public function deleteReferrerOrder(ReferrerOrder $referrer): void
    {
        if (!$referrer->acceptances()->exists() && !$referrer->consultations()->exists()) {
            $this->referrerRepository->deleteReferrerOrder($referrer);
        } else {
            throw new Exception("ReferrerOrder has associated acceptances or Orders.");
        }
    }

    public function getReferrerOrderByEmail($idNo): ?ReferrerOrder
    {
        return $this->referrerRepository->findReferrerOrderByEmail($idNo);
    }

    public function getReferrerOrderById($id)
    {
        return $this->referrerRepository->findReferrerOrderById($id);
    }

}
