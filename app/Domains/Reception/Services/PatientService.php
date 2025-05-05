<?php

namespace App\Domains\Reception\Services;

use App\Domains\Document\Enums\DocumentTag;
use App\Domains\Reception\DTOs\PatientDTO;
use App\Domains\Reception\Events\PatientDocumentUpdateEvent;
use App\Domains\Reception\Models\Patient;
use App\Domains\Reception\Repositories\PatientRepository;
use Exception;

readonly class PatientService
{
    public function __construct(
        private PatientRepository $patientRepository,
    )
    {
    }

    public function listPatients(array $filters)
    {
        return $this->patientRepository->listPatient($filters);
    }

    public function createPatient(PatientDTO $patientDTO): Patient
    {
        $avatarId = $patientDTO->avatar['id'] ?? null;
        if ($avatarId)
            $patientDTO->avatar = relative_route("documents.download", [$avatarId]);
        $patient = $this->patientRepository->createPatient($patientDTO->toArray());

        if ($avatarId)
            PatientDocumentUpdateEvent::dispatch($avatarId, $patient->id, DocumentTag::AVATAR->value);

        return $patient;
    }

    public function getPatientDetails(Patient $patient): array
    {
        $patient->load([
            "invoices" => function ($query) {
                $query->latest()->limit(5);
            },
            "payments" => function ($query) {
                $query->latest()->limit(5);
            },
            "acceptances" => function ($query) {
                $query->latest()->limit(5);
            },
            "consultations" => function ($query) {
                $query->latest()->limit(5);
            },
            "patientMeta",
            "patients",
            "relatives"
        ])
            ->loadCount(["invoices", "payments", "acceptances", "consultations"]);
        return [
            "patient" => $patient->withoutRelations(),
            "relatives" => $this->getPatientRelatives($patient),
            "invoices" => $patient->invoices,
            "payments" => $patient->payments,
            "acceptances" => $patient->acceptances,
            "consultations" => $patient->consultations,
            "documents" => $this->patientRepository->getPatientDocuments($patient),
            "patientMeta" => $patient->patientMeta,
            "stats" => [
                "invoices" => $patient->invoices_count,
                "payments" => $patient->payments_count,
                "acceptances" => $patient->acceptances_count,
                "consultations" => $patient->consultations_count,
            ]
        ];
    }

    public function updatePatient(Patient $patient, PatientDTO $newPatientDTO): Patient
    {
        $avatarId = $newPatientDTO->avatar['id'] ?? null;
        if ($avatarId) {
            $newPatientDTO->avatar = relative_route("documents.download", [$avatarId]);
            PatientDocumentUpdateEvent::dispatch($avatarId, $patient->id, DocumentTag::AVATAR->value);
        }
        $updated = $this->patientRepository->updatePatient($patient, $newPatientDTO->toArray());
        if (isset($data['documents'])) {
            foreach ($data['documents'] as $doc) {
                if (isset($doc['id']))
                    PatientDocumentUpdateEvent::dispatch($doc['id'], $patient->id, DocumentTag::DOCUMENT->value);
            }
        }
        return $updated;
    }

    /**
     * @throws Exception
     */
    public function deletePatient(Patient $patient): void
    {
        if (!$patient->acceptances()->exists() && !$patient->consultations()->exists()) {
            $patient->ownedDocuments()->delete();
            $patient->relatedDocuments()->delete();
            $this->patientRepository->deletePatient($patient);
        } else {
            throw new Exception("Patient has associated acceptances or consultations.");
        }
    }

    public function getPatientByIdNo($idNo): ?Patient
    {
        return $this->patientRepository->findPatientByIdNo($idNo);
    }

    public function getPatientById($id)
    {
        return $this->patientRepository->findPatientById($id);
    }

    public function getPatientStats()
    {
        return [
            "patients" => $this->patientRepository->countPatients(),
            "patientsPerNation" => $this->patientRepository->countPatients("nationality"),
            "patientsPerGender" => $this->patientRepository->countPatients("gender"),

        ];
    }

    protected function getPatientRelatives(Patient $patient)
    {
        $output = [];
        $all = $patient->relatives->merge($patient->patients);
        foreach ($all as $relative) {
            $output[] = [
                "id" => $relative->id,
                "fullName" => $relative->fullName,
                "idNo" => $relative->idNo,
                "gender" => $relative->gender,
                "relationship" => $this->getRelation($patient, $relative),
                "relative_id" => $relative->pivot->id
            ];
        }
        return $output;
    }


    protected function getRelation($patient, $relative)
    {
        switch ($relative->pivot->relationship) {
            case "father":
            case "mother":
                if ($patient->id == $relative->pivot->patient_id)
                    return $relative->pivot->relationship;
                return "child";
            case "grandfather":
            case "grandmother":
                if ($patient->id == $relative->pivot->patient_id)
                    return $relative->pivot->relationship;
                return "grandchild";
            case "brother":
            case "sister":
                if ($patient->id == $relative->pivot->patient_id)
                    return $relative->pivot->relationship;
                return $patient->gender == "male" ? "brother" : "sister";
            case "husband":
                if ($patient->id == $relative->pivot->patient_id)
                    return $relative->pivot->relationship;
                return "wife";
            case "child":
                if ($patient->id == $relative->pivot->patient_id)
                    return $relative->pivot->relationship;
                return $patient->gender == "male" ? "father" : "mother";
            case "wife":
                if ($patient->id == $relative->pivot->patient_id)
                    return $relative->pivot->relationship;
                return "husband";
            default:
                return $relative->pivot->relationship;
        }
    }
}
