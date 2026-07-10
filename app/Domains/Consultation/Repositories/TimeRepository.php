<?php

namespace App\Domains\Consultation\Repositories;

use Illuminate\Database\Eloquent\Builder;

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

    /**
     * @param  \Illuminate\Database\Eloquent\Builder<\App\Domains\Consultation\Models\Time>  $query
     */
    private function applyFilters(Builder $query, array $filters): void
    {
        if (isset($filters["consultant_id"]))
            $query->where("consultant_id", $filters["consultant_id"]);
        if (isset($filters["startDate"]))
            $query->whereDate("started_at", ">=", Carbon::parse($filters["startDate"])->startOfDay()->format("Y-m-d"));
        if (isset($filters["endDate"])) {
            $query->whereDate("started_at", "<=", Carbon::parse($filters["endDate"])->endOfDay()->format("Y-m-d"));
            if (isset($filters["betweenDate"]))
                $query->whereBetween("started_at", $filters["betweenDate"]);
        }
    }

}
