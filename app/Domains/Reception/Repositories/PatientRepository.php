<?php

namespace App\Domains\Reception\Repositories;

use App\Domains\Reception\Models\Patient;
use Illuminate\Database\Eloquent\Collection;
use function Laravel\Prompts\select;

class PatientRepository
{
    public function listPatient(array $queryData)
    {
        $query = Patient::withCount(["Acceptances", "Relatives", "Payments"])
            ->withSum("Payments", "price")
            ->withSum("AcceptanceItems", "price")
            ->withSum("AcceptanceItems", "discount");
        if (isset($queryData["filters"])) {
            $this->applyFilters($query, $queryData["filters"]);
        }
        $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData["pageSize"]);
    }

    public function createPatient(array $data): Patient
    {
        $patient = new Patient($data);
        $patient->registrar()->associate(auth()->user()->id);
        $patient->save();
        return $patient;
    }

    public function updatePatient(Patient $patient, array $data): Patient
    {
        $patient->update($data);
        return $patient;
    }

    public function getRelatives(Patient $patient): Collection
    {
        $relatives = $patient->relatives()->get();
        $patients = $patient->relatives()->get();
        return $relatives
            ->merge($patients)
            ->unique("id");
    }

    public function getPatientDocuments(Patient $patient): array
    {
        return $patient->ownedDocuments()->whereNotIn('tag', ['temp', 'avatar'])
            ->get()
            ->map(fn($doc) => ['id' => $doc->hash, 'originalName' => $doc->originalName, "tag" => $doc->tag, "created_at" => $doc->created_at,"ext" => $doc->ext])
            ->toArray();
    }

    public function deletePatient(Patient $patient): void
    {
        $patient->delete();
    }

    public function findPatientByIdNo($idNo)
    {
        return Patient::where('idNo', $idNo)->first();
    }

    public function findPatientById($id): ?Patient
    {
        return Patient::find($id);
    }

    public function applyFilters($query, array $filters)
    {
        if (isset($filters["search"]))
            $query->search(["fullName", "idNo", "phone"], $filters["search"]);
        if (isset($filters["patient"]))
            $query->where("patients.id", $filters["patient"])
                ->orWhereHas("relatives", fn($q) => $q->where("relatives.patient_id", $filters["patient"]))
                ->orWhereHas("patients", fn($q) => $q->where("relatives.relative_id", $filters["patient"]));
    }

    public function countPatients($field = null):int|array
    {
        switch ($field) {
            case "nationality":
                return Patient::select('nationality', \DB::raw('count(*) as count'))
                    ->groupBy('nationality')
                    ->orderBy('count', 'desc')
                    ->pluck('count', 'nationality')
                    ->toArray();
                break;
            case "gender":
                return Patient::select('gender', \DB::raw('count(*) as count'))
                    ->groupBy('gender')
                    ->pluck('count', 'gender')
                    ->toArray();
                break;
            default:
                return Patient::count();
        }
    }
}
