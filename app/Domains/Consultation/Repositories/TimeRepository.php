<?php

namespace App\Domains\Consultation\Repositories;

use App\Domains\Consultation\Models\Time;
use Illuminate\Database\Eloquent\Collection;

class TimeRepository
{
    public function listTime(array $queryData): Collection
    {
        $query = Time::query()
            ->with(["reservable.patient","consultant"]);
        if (isset($queryData["filters"])) {
            $this->applyFilters($query, $queryData["filters"]);
        }
        return $query->get();
    }

    public function createTime(array $data): Time
    {
        return Time::create($data);
    }

    public function updateTime(Time $time, array $data): Time
    {
        $time->fill($data);
        if ($time->isDirty())
            $time->save();
        return $time;
    }

    public function deleteTime(Time $time): void
    {
        $time->delete();
    }

    private function applyFilters($query, array $filters)
    {
        if (isset($filters["consultant_id"]))
            $query->where("consultant_id", $filters["consultant_id"]);
        if (isset($filters["startDate"])){
            $query->whereDate("started_at", ">=", $filters["startDate"]);
        }
        if (isset($filters["endDate"])){
            $query->whereDate("started_at", "<=", $filters["endDate"]);
        }
    }
}
