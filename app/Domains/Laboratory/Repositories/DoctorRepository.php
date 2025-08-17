<?php

namespace App\Domains\Laboratory\Repositories;

use App\Domains\Laboratory\Models\Doctor;
use App\Domains\User\Enums\ActivityType;
use App\Domains\User\Services\UserActivityService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class DoctorRepository
{

    public function listDoctors(array $queryData): LengthAwarePaginator
    {
        $query = Doctor::withCount(["acceptances"]);
        if (isset($queryData["filters"]))
            $this->applyFilters($query, $queryData["filters"]);
        if (isset($queryData["sort"]))
            $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData["pageSize"] ?? 10);
    }

    public function creatDoctor(array $doctorData): Doctor
    {
        $doctor = Doctor::query()->make($doctorData);
        $doctor->save();
        UserActivityService::createUserActivity($doctor,ActivityType::CREATE);
        return $doctor;
    }

    public function updateDoctor(Doctor $doctor, array $doctorData): Doctor
    {
        $doctor->fill($doctorData);
        if ($doctor->isDirty()) {
            $doctor->save();
            UserActivityService::createUserActivity($doctor,ActivityType::UPDATE);
        }
        return $doctor;
    }

    public function deleteDoctor(Doctor $doctor): void
    {
        $doctor->delete();
        UserActivityService::createUserActivity($doctor,ActivityType::DELETE);
    }

    protected function applyFilters($query, array $filters)
    {
        if (isset($filters["search"]))
            $query->search($filters["search"]);
    }

    public function getDoctorByName(string $name): ?Doctor
    {
        return Doctor::query()->where("name", $name)->first();
    }

}
