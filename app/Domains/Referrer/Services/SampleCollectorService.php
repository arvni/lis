<?php

namespace App\Domains\Referrer\Services;

use App\Domains\Referrer\DTOs\SampleCollectorDTO;
use App\Domains\Referrer\Models\SampleCollector;
use App\Domains\Referrer\Repositories\SampleCollectorRepository;
use Exception;
use Illuminate\Pagination\LengthAwarePaginator;

class SampleCollectorService
{
    public function __construct(protected SampleCollectorRepository $sampleCollectorRepository)
    {
    }

    public function listSampleCollectors(array $filters): LengthAwarePaginator
    {
        return $this->sampleCollectorRepository->listSampleCollector($filters);
    }

    public function createSampleCollector(SampleCollectorDTO $sampleCollectorDTO): SampleCollector
    {
        return $this->sampleCollectorRepository->createSampleCollector($sampleCollectorDTO->toArray());
    }

    public function getSampleCollectorDetails(SampleCollector $sampleCollector): array
    {
        $sampleCollector->load([
            'collectRequests' => function ($query) {
                $query->with(['referrer'])->latest()->limit(10);
            }
        ]);

        return [
            "sampleCollector" => $sampleCollector,
            "collectRequests" => $sampleCollector->collectRequests,
        ];
    }

    public function updateSampleCollector(SampleCollector $sampleCollector, SampleCollectorDTO $sampleCollectorDTO): SampleCollector
    {
        return $this->sampleCollectorRepository->updateSampleCollector($sampleCollector, $sampleCollectorDTO->toArray());
    }

    /**
     * @throws Exception
     */
    public function deleteSampleCollector(SampleCollector $sampleCollector): void
    {
        if ($sampleCollector->collectRequests()->exists()) {
            throw new Exception("SampleCollector has associated collect requests.");
        }
        $this->sampleCollectorRepository->deleteSampleCollector($sampleCollector);
    }

    public function getSampleCollectorByEmail($email): ?SampleCollector
    {
        return $this->sampleCollectorRepository->findSampleCollectorByEmail($email);
    }

    public function getSampleCollectorById($id): ?SampleCollector
    {
        return $this->sampleCollectorRepository->findSampleCollectorById($id);
    }
}
