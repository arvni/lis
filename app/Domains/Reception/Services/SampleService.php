<?php

namespace App\Domains\Reception\Services;


use App\Domains\Reception\DTOs\SampleDTO;
use App\Domains\Reception\Models\Sample;
use App\Domains\Reception\Repositories\SampleRepository;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Arr;

class SampleService
{
    public function __construct(private SampleRepository $sampleRepository)
    {
    }

    public function listSamples($queryData)
    {
        return $this->sampleRepository->listSamples($queryData);
    }

    public function listSampleBarcodes($filters): Collection
    {
        return $this->sampleRepository->listSampleBarcodes($filters);
    }

    public function storeSample(SampleDTO $sampleDTO, $index = 0): Sample
    {
        $sample = $this->sampleRepository->findActiveSample(Arr::pluck($sampleDTO->acceptanceItems, "id"), $sampleDTO->patientId, $sampleDTO->sampleTypeId);
        if (!$sample) {
            $deactivatedSample = $this->sampleRepository->findDeactivatedSample(Arr::pluck($sampleDTO->acceptanceItems, "id"), $sampleDTO->patientId, $sampleDTO->sampleTypeId);
            if ($deactivatedSample) {
                $sampleDTO->barcode = $deactivatedSample->barcode . "R";
            }

            if (!$sampleDTO->barcode) {
                $sampleDTO->barcode = $this->generateBarcode($sampleDTO->barcodeGroup, $index);
            }

            $sample = $this->sampleRepository->creatSample(Arr::except($sampleDTO->toArray(), "id"));
        } else
            $this->sampleRepository->syncAcceptanceItems($sample, Arr::pluck($sampleDTO->acceptanceItems, "id"));
        return $sample;
    }

    public function updateSample(Sample $sample, SampleDTO $sampleDTO): Sample
    {
        return $this->sampleRepository->updateSample($sample, $sampleDTO->toArray());
    }

    public function findSampleById($id): ?Sample
    {
        return $this->sampleRepository->findSampleById($id);
    }

    public function findSampleByBarcode($barcode): ?Sample
    {
        return $this->sampleRepository->findSampleByBarcode($barcode);
    }


    public function deleteSample(Sample $sample): void
    {
        $this->sampleRepository->deleteSample($sample);
    }


    public function generateBarcode(array $barcodeGroup, int $index): string
    {
        return $barcodeGroup["abbr"] . (Carbon::now()->getTimestamp() + $index);
    }

}
