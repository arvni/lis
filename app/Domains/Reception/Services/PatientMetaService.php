<?php

namespace App\Domains\Reception\Services;

use App\Domains\Reception\DTOs\PatientMetaDTO;
use App\Domains\Reception\Models\Patient;
use App\Domains\Reception\Repositories\PatientRepository;

class PatientMetaService
{
    public function __construct(protected PatientRepository $patientRepository)
    {
    }

    public function updatePatient(Patient $patient, PatientMetaDTO $patientMetaDTO): void
    {
        $patient->patientMeta()->update($patientMetaDTO->toArray());
    }
}
