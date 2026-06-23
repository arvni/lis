<?php

namespace App\Domains\Setting\Repositories;

use App\Domains\Setting\Models\Setting;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class SettingRepository
{

    public function listSettings(array $queryData): LengthAwarePaginator
    {
        $query = Setting::query();
        if (isset($queryData["filters"]))
            $this->applyFilters($query, $queryData["filters"]);
        if (isset($queryData["sort"]))
            $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData["pageSize"] ?? 10);
    }


    public function updateSetting(Setting $setting, mixed $value): Setting
    {
        $setting->update(["value" => [...$setting->value, "value" => $value]]);
        return $setting;
    }

    public function getSettingsByClass(string $class): array
    {
        $settings = Setting::where("class", $class)
            ->get()
            ->keyBy("key")
            ->map(fn($item) => $item->value["value"])
            ->toArray();

        return $settings;
    }

    public function getSettingsByClassAndKey(string $class, string $key): mixed
    {
        return Setting::where("class", $class)
            ->where("key", $key)
            ->first()?->value["value"];
    }

    /**
     * @param  Builder<Setting>  $query
     */
    protected function applyFilters(Builder $query, array $filters): void
    {
        if (isset($filters["search"]))
            $query->search(["title"], $filters["search"]);
        if (isset($filters["settingClass"]))
            $query->where("class", $filters["settingClass"]);
    }

}
