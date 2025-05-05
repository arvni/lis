<?php

namespace App\Domains\Consultation\Repositories;

use App\Domains\Consultation\Models\Consultation;
use App\Domains\User\Models\User;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;
use Ramsey\Collection\Collection;

class ConsultationRepository
{
    private string $durationStatement;

    public function __construct()
    {
        $this->durationStatement = match (env('DB_CONNECTION')) {
            'pgsql' => <<<SQL
            EXTRACT(EPOCH FROM NOW() - COALESCE(started_at, NOW())) / 60 AS waiting_time
        SQL,
            default => <<<SQL
            TIMESTAMPDIFF(MINUTE, COALESCE(started_at, NOW()), dueDate) AS waiting_time
        SQL,
        };
    }

    public function listConsultation(array $queryData): LengthAwarePaginator
    {
        $query = Consultation::query()->selectRaw('*, ' . $this->durationStatement)
            ->withAggregate("consultant", "name")
            ->withAggregate("Patient", "fullName");
        if (isset($queryData["filters"])) {
            $this->applyFilters($query, $queryData["filters"]);
        }
        $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData["pageSize"]);
    }

    public function createConsultation(array $data): Consultation
    {
        return Consultation::create($data);
    }

    public function updateConsultation(Consultation $consultation, array $data): Consultation
    {
        $consultation->fill($data);
        if ($consultation->isDirty())
            $consultation->save();
        return $consultation;
    }

    public function deleteConsultation(Consultation $consultation): void
    {
        $consultation->delete();
    }


    public function findLatestConsultation($patientId): ?Consultation
    {
        return Consultation::where("patient_id", $patientId)->latest()->first();
    }

    private function applyFilters($query, array $filters)
    {
        if (isset($filters["search"]))
            $query->search($filters["search"]);
        if (isset($filters["status"]))
            $query->whereIn("status", $filters["status"]);
    }


    public function isTimeSlotBooked(User $user, Carbon $startTime, Carbon $endTime): bool
    {

        return (bool)$user->consultations()
            ->whereBetween("dueDate", [$startTime, $endTime])
            ->whereNot("status", "done")
            ->count();
    }
}
