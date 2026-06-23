<?php

declare(strict_types=1);

namespace App\Domains\Referrer\Adapters;

use App\Domains\Laboratory\Services\SampleTypeService;

/**
 * Adapter that lets the Referrer domain read Laboratory sample types without
 * reaching into Laboratory services/models directly.
 */
class LaboratoryAdapter
{
    public function __construct(private readonly SampleTypeService $sampleTypeService) {}

    /**
     * Display name of a sample type by id.
     */
    public function getSampleTypeName(int|string $id): string
    {
        return $this->sampleTypeService->getSampleTypeById($id)->name;
    }
}
