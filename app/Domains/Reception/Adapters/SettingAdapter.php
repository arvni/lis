<?php

declare(strict_types=1);

namespace App\Domains\Reception\Adapters;

use App\Domains\Setting\Repositories\SettingRepository;

/**
 * Adapter that lets the Reception domain read configuration from the Setting
 * domain without reaching into its repositories directly.
 */
class SettingAdapter
{
    public function __construct(private readonly SettingRepository $settingRepository) {}

    /**
     * Resolve a single setting value by its class + key.
     */
    public function getSettingByClassAndKey(string $class, string $key): mixed
    {
        return $this->settingRepository->getSettingsByClassAndKey($class, $key);
    }
}
