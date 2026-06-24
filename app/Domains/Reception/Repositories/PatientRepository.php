<?php

namespace App\Domains\Reception\Repositories;

use App\Domains\Shared\Traits\LogsUserActivity;
use App\Domains\Document\Enums\DocumentTag;
use App\Domains\Reception\Models\Patient;
use DB;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use function Laravel\Prompts\select;

class PatientRepository
{
    use LogsUserActivity;

    /**
     * @return LengthAwarePaginator<int, Patient>
     */
    public function listPatient(array $queryData): LengthAwarePaginator
    {
        $query = Patient::withCount(["acceptances", "relatives", "payments", "consultations"])
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
        $this->logCreated($patient);
        return $patient;
    }

    public function updatePatient(Patient $patient, array $data): Patient
    {
        $patient->update($data);
        $this->logUpdated($patient);
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
        return $patient->ownedDocuments()
            ->allowedTag()
            ->get()
            ->map(fn($doc) => ['id' => $doc->hash, 'originalName' => $doc->originalName, "tag" => $doc->tag, "created_at" => $doc->created_at, "ext" => $doc->ext])
            ->toArray();
    }

    public function deletePatient(Patient $patient): void
    {
        $patient->delete();
        $this->logDeleted($patient);
    }

    public function findPatientByIdNo(string $idNo): ?Patient
    {
        return Patient::where('idNo', $idNo)->first();
    }

    public function findPatientById(int|string $id): ?Patient
    {
        return Patient::find($id);
    }

    /**
     * @param  Builder<Patient>  $query
     * @param  array<string, mixed>  $filters
     */
    public function applyFilters(Builder $query, array $filters): void
    {
        if (isset($filters["search"]))
            $query->search($filters["search"]);
        if (!empty($filters["nationality"]))
            $query->where("nationality", $filters["nationality"]);
        if (!empty($filters["gender"]))
            $query->where("gender", $filters["gender"]);
        if (!empty($filters["governorate"]))
            $query->where("governorate", $filters["governorate"]);
        if (!empty($filters["wilayat"]))
            $query->where("wilayat", $filters["wilayat"]);
        if (!empty($filters["dobFrom"]))
            $query->whereDate("dateOfBirth", ">=", $filters["dobFrom"]);
        if (!empty($filters["dobTo"]))
            $query->whereDate("dateOfBirth", "<=", $filters["dobTo"]);
        if (!empty($filters["registeredFrom"]))
            $query->whereDate("created_at", ">=", $filters["registeredFrom"]);
        if (!empty($filters["registeredTo"]))
            $query->whereDate("created_at", "<=", $filters["registeredTo"]);
        if (isset($filters["patient"]))
            $query->where("patients.id", $filters["patient"])
                ->orWhereHas("relatives", fn($q) => $q->where("relatives.patient_id", $filters["patient"]))
                ->orWhereHas("patients", fn($q) => $q->where("relatives.relative_id", $filters["patient"]));
    }

    public function countPatients(?string $field = null): int|array
    {
        switch ($field) {
            case "nationality":
                return Patient::select('nationality', DB::raw('count(*) as count'))
                    ->groupBy('nationality')
                    ->orderBy('count', 'desc')
                    ->pluck('count', 'nationality')
                    ->toArray();
            case "gender":
                return Patient::select('gender', DB::raw('count(*) as count'))
                    ->groupBy('gender')
                    ->pluck('count', 'gender')
                    ->toArray();
            default:
                return Patient::count();
        }
    }
}
