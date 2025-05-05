<?php

namespace App\Domains\Referrer\Services;

use App\Domains\Referrer\DTOs\ReferrerDTO;
use App\Domains\Referrer\Models\Referrer;
use App\Domains\Referrer\Repositories\ReferrerRepository;
use Exception;
use Illuminate\Pagination\LengthAwarePaginator;

class ReferrerService
{
    public function __construct(protected ReferrerRepository $referrerRepository)
    {
    }

    public function listReferrers(array $filters): LengthAwarePaginator
    {
        return $this->referrerRepository->listReferrer($filters);
    }

    public function createReferrer(ReferrerDTO $referrerDTO): Referrer
    {
        return $this->referrerRepository->createReferrer($referrerDTO->toArray());
    }

    public function getReferrerDetails(Referrer $referrer): array
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

    public function updateReferrer(Referrer $referrer, ReferrerDTO $newReferrerDTO): Referrer
    {

        return $this->referrerRepository->updateReferrer($referrer, $newReferrerDTO->toArray());
    }

    /**
     * @throws Exception
     */
    public function deleteReferrer(Referrer $referrer): void
    {
        if (!$referrer->acceptances()->exists() && !$referrer->consultations()->exists()) {
            $this->referrerRepository->deleteReferrer($referrer);
        } else {
            throw new Exception("Referrer has associated acceptances or Orders.");
        }
    }

    public function getReferrerByEmail($idNo): ?Referrer
    {
        return $this->referrerRepository->findReferrerByEmail($idNo);
    }

    public function getReferrerById($id)
    {
        return $this->referrerRepository->findReferrerById($id);
    }

}
