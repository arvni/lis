<?php

declare(strict_types=1);

namespace App\Domains\Referrer\Adapters;

use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\Patient;
use App\Domains\Reception\Repositories\AcceptanceRepository;
use Illuminate\Database\Eloquent\Collection;

/**
 * Adapter that lets the Referrer domain read Reception acceptances without
 * reaching into Reception models/queries directly.
 */
class ReceptionAdapter
{
    public function __construct(private readonly AcceptanceRepository $acceptanceRepository) {}

    /**
     * Acceptances belonging to a patient for a given referrer.
     *
     * @return Collection<int, Acceptance>
     */
    public function getPatientAcceptances(Patient $patient, ?int $referrerId, bool $poolingOnly): Collection
    {
        return $this->acceptanceRepository->getForPatientAndReferrer($patient->id, $referrerId, $poolingOnly);
    }

    /**
     * A single acceptance by id, or null when it does not exist.
     */
    public function findAcceptance(int $acceptanceId): ?Acceptance
    {
        return $this->acceptanceRepository->getAcceptanceById($acceptanceId);
    }
}
