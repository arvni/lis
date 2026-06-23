<?php

declare(strict_types=1);

namespace App\Domains\Consultation\Adapters;

use App\Domains\Setting\Repositories\SettingRepository;

/**
 * Adapter that lets the Consultation domain read configuration from the Setting
 * domain without reaching into its repositories directly.
 */
class SettingAdapter
{
    public function __construct(private readonly SettingRepository $settingRepository) {}

    /**
     * All settings for a given class, keyed by setting key.
     *
     * @return array<string, mixed>
     */
    public function getSettingsByClass(string $class): array
    {
        return $this->settingRepository->getSettingsByClass($class);
    }
}
