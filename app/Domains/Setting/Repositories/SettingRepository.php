<?php

namespace App\Domains\Setting\Repositories;

use App\Domains\Setting\Models\Setting;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

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


    public function updateSetting(Setting $setting, $value): Setting
    {
        $setting->update(["value" => [...$setting->value, "value" => $value]]);
        return $setting;
    }

    public function getSettingsByClass($class): array
    {
        $settings = Setting::where("class", $class)
            ->get()
            ->keyBy("key")
            ->map(fn($item) => $item->value["value"])
            ->toArray();

        return $settings;
    }

    public function getSettingsByClassAndKey($class, $key)
    {
        return Setting::where("class", $class)
            ->where("key", $key)
            ->first()?->value["value"];
    }

    protected function applyFilters($query, array $filters)
    {
        if (isset($filters["search"]))
            $query->search(["name"], $filters["search"]);
        if (isset($filters["settingClass"]))
            $query->where("class", $filters["settingClass"]);
    }

}
