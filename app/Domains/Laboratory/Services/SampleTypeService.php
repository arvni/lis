<?php

namespace App\Domains\Laboratory\Services;


use App\Domains\Laboratory\DTOs\SampleTypeDTO;
use App\Domains\Laboratory\Models\SampleType;
use App\Domains\Laboratory\Repositories\SampleTypeRepository;
use Exception;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class SampleTypeService
{
    public function __construct(private SampleTypeRepository $sampleTypeRepository)
    {
    }

    public function listSampleTypes($queryData): LengthAwarePaginator
    {
        return $this->sampleTypeRepository->ListSampleTypes($queryData);
    }

    public function storeSampleType(SampleTypeDTO $sampleTypeDTO): SampleType
    {
        return $this->sampleTypeRepository->creatSampleType($sampleTypeDTO->toArray());
    }

    public function updateSampleType(SampleType $sampleType, SampleTypeDTO $sampleTypeDTO): SampleType
    {
        return $this->sampleTypeRepository->updateSampleType($sampleType, $sampleTypeDTO->toArray());
    }

    /**
     * @throws Exception
     */
    public function deleteSampleType(SampleType $sampleType): void
    {
        if (!$sampleType->samples()->exists()) {
            $this->sampleTypeRepository->deleteSampleType($sampleType);
        } else
            throw new Exception("This sampleType has some Acceptance or participate in Workflow");
    }
}
