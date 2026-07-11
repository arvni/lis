<?php

declare(strict_types=1);

namespace App\Domains\Consultation\Repositories;

use Illuminate\Database\Eloquent\Builder;

use App\Domains\Shared\Traits\LogsUserActivity;
use App\Domains\Consultation\Enums\ConsultationStatus;
use App\Domains\Consultation\Models\Consultation;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class ConsultationRepository
{
    use LogsUserActivity;

    private string $durationStatement;

    public function __construct()
    {
        $this->durationStatement = match (config('database.default')) {
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

    /**
     * @return \Illuminate\Database\Eloquent\Builder<\App\Domains\Consultation\Models\Consultation>
     */
    public function getQuery(): Builder
    {
        return Consultation::query()->selectRaw('*, ' . $this->durationStatement)
            ->withAggregate("consultant", "name")
            ->withAggregate("patient", "fullName")
            ->withAggregate("patient", "phone");
    }

    public function createConsultation(array $data): Consultation
    {
        $consultation= Consultation::create($data);
        $this->logCreated($consultation);
        return $consultation;
    }

    public function updateConsultation(Consultation $consultation, array $data): Consultation
    {
        $consultation->fill($data);
        if ($consultation->isDirty()) {
            $consultation->save();
            $this->logUpdated($consultation);
        }
        return $consultation;
    }

    public function deleteConsultation(Consultation $consultation): void
    {
        $consultation->delete();
        $this->logDeleted($consultation);
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Builder<\App\Domains\Consultation\Models\Consultation>  $query
     */
    private function applyFilters(Builder $query, array $filters): void
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

    public function getTotalConsultationForDateRange(array $dateRange): int
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
