<?php

namespace App\Domains\Setting\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;


use App\Domains\Setting\Models\Setting;
use App\Domains\Setting\Repositories\SettingRepository;
use Exception;

class SettingService
{
    public function __construct(private readonly SettingRepository $settingRepository)
    {
    }

    public function listSettings(array $queryData): LengthAwarePaginator
    {
        return $this->settingRepository->ListSettings($queryData);
    }
    public function updateSetting(Setting $setting, array $settingData): Setting
    {
        $value = $settingData["value"];
        if ($setting->value["type"] === "password" && ($value["value"] === '' || $value["value"] === null)) {
            return $setting;
        }

        $v = match ($setting->value["type"]) {
            "image"    => (is_string($value["value"]) ? $value["value"] : route("documents.show", $value["value"]["id"])),
            "file"     => [...$value["value"], "url" => route("documents.show", $value["value"]["id"])],
            "password" => encrypt($value["value"]),
            default    => $value["value"],
        };

        return $this->settingRepository->updateSetting($setting, $v);
    }

    public function getSettingByKey(string $class, string $key): mixed
    {
        return $this->settingRepository->getSettingsByClassAndKey($class,$key);
    }
}
