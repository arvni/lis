<?php

namespace App\Domains\Consultation\Repositories;

use App\Domains\Consultation\Models\Time;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;

class TimeRepository
{
    public function listTimes(array $queryData): Collection
    {
        $query = Time::query()
            ->with(["reservable.patient", "consultant"]);
        if (isset($queryData["filters"]))
            $this->applyFilters($query, $queryData["filters"]);
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
        if (isset($filters["startDate"]))
            $query->whereDate("started_at", ">=", Carbon::parse($filters["startDate"],"Asia/Muscat")->startOfDay()->format("Y-m-d"));
        if (isset($filters["endDate"])) {
            $query->whereDate("started_at", "<=", Carbon::parse($filters["endDate"],"Asia/Muscat")->endOfDay()->format("Y-m-d"));
            if (isset($filters["betweenDate"]))
                $query->whereBetween("started_at", $filters["betweenDate"]);
        }
    }

}
