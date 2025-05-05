<?php

namespace App\Domains\Setting\Services;


use App\Domains\Setting\Models\Setting;
use App\Domains\Setting\Repositories\SettingRepository;
use Exception;

class SettingService
{
    public function __construct(private readonly SettingRepository $settingRepository)
    {
    }

    public function listSettings($queryData)
    {
        return $this->settingRepository->ListSettings($queryData);
    }
    public function updateSetting(Setting $setting, $settingData): Setting
    {
        $value = $settingData["value"];
        $v = match ($setting->value["type"]) {
            "image" => (is_string($value["value"]) ? $value["value"] : route("documents.show", $value["value"]["id"])),
            "file" => [...$value["value"], "url" => route("documents.show", $value["value"]["id"])],
            default => $value["value"],
        };

        return $this->settingRepository->updateSetting($setting, $v);
    }

    public function getSettingByKey($class,$key)
    {
        return $this->settingRepository->getSettingsByClassAndKey($class,$key);
    }
}
