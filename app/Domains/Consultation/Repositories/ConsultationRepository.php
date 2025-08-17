<?php

namespace App\Domains\Consultation\Repositories;

use App\Domains\Consultation\Enums\ConsultationStatus;
use App\Domains\Consultation\Models\Consultation;
use App\Domains\User\Enums\ActivityType;
use App\Domains\User\Services\UserActivityService;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

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
        $query = $this->getQuery();
        if (isset($queryData["filters"])) {
            $this->applyFilters($query, $queryData["filters"]);
        }
        $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData["pageSize"]);
    }

    public function getAll(array $queryData): Collection
    {
        $query = $this->getQuery();
        if (isset($queryData["filters"])) {
            $this->applyFilters($query, $queryData["filters"]);
        }
        $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');

        if (isset($queryData["limit"]))
            $query->take($queryData["limit"]);

        return $query->get();
    }

    public function getQuery()
    {
        return Consultation::query()->selectRaw('*, ' . $this->durationStatement)
            ->withAggregate("consultant", "name")
            ->withAggregate("patient", "fullName")
            ->withAggregate("patient", "phone");
    }

    public function createConsultation(array $data): Consultation
    {
        $consultation= Consultation::create($data);
        UserActivityService::createUserActivity($consultation,ActivityType::CREATE);
        return $consultation;
    }

    public function updateConsultation(Consultation $consultation, array $data): Consultation
    {
        $consultation->fill($data);
        if ($consultation->isDirty()) {
            $consultation->save();
            UserActivityService::createUserActivity($consultation,ActivityType::UPDATE);
        }
        return $consultation;
    }

    public function deleteConsultation(Consultation $consultation): void
    {
        $consultation->delete();
        UserActivityService::createUserActivity($consultation,ActivityType::DELETE);
    }

    private function applyFilters($query, array $filters): void
    {
        if (isset($filters["search"]))
            $query->search($filters["search"]);
        if (isset($filters["status"]))
            $query->whereIn("status", $filters["status"]);
        if (isset($filters["from_date"]))
            $query->whereDate("dueDate", ">=", $filters["from_date"]);
        if (isset($filters["consultant_id"]))
            $query->where("consultant_id", $filters["consultant_id"]);
        if (isset($filters["date"])){
            $date=Carbon::parse($filters["date"]);
            $dateRange=[$date->copy()->startOfDay(),$date->copy()->endOfDay()];
            $query->whereBetween('created_at', $dateRange);
        }
    }

    public function getTotalConsultationForDateRange($dateRange): int
    {
        return Consultation::query()
            ->whereBetween("dueDate", $dateRange)
            ->where("status", "done")
            ->count();
    }

    public function getTotalWaitingForConsultation(): int
    {
        return Consultation::query()
            ->where("status", ConsultationStatus::WAITING)
            ->count();
    }

}
