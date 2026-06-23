<?php

declare(strict_types=1);

namespace App\Domains\Billing\Adapters;

use App\Domains\Setting\Services\SettingService;

/**
 * Adapter that lets the Billing domain read configuration from the Setting
 * domain without reaching into its services directly.
 */
class SettingAdapter
{
    public function __construct(private readonly SettingService $settingService) {}

    /**
     * Resolve a single setting value by its class + key.
     */
    public function getSettingByKey(string $class, string $key): mixed
    {
        return $this->settingService->getSettingByKey($class, $key);
    }
}
