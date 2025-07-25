<?php

namespace App\Domains\Referrer\Services;


use App\Domains\Laboratory\Services\SampleTypeService;
use App\Domains\Referrer\DTOs\GroupMaterialDTO;
use App\Domains\Referrer\DTOs\MaterialDTO;
use App\Domains\Referrer\Models\Material;
use App\Domains\Referrer\Repositories\MaterialRepository;
use Carbon\Carbon;
use Exception;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

readonly class MaterialService
{
    public function __construct(private MaterialRepository $materialRepository, private SampleTypeService $sampleTypeService)
    {
    }

    public function listMaterials($queryData): LengthAwarePaginator
    {
        return $this->materialRepository->ListMaterials($queryData);
    }

    public function listPackingSeriesMaterials($queryData): LengthAwarePaginator
    {
        return $this->materialRepository->listPackingSeriesMaterials($queryData);
    }

    public function storeMaterial(GroupMaterialDTO $groupMaterialDTO): string
    {
        $sampleType = $this->sampleTypeService->getSampleTypeById($groupMaterialDTO->sampleTypeId);
        $now = Carbon::now();
        $packingSeries = $this->generatePackingSeries($sampleType->name, $now);
        foreach ($groupMaterialDTO->tubes as $key => $tube) {
            $this->materialRepository->creatMaterial([
                "sample_type_id" => $groupMaterialDTO->sampleTypeId,
                "barcode" => $this->generateBarcode($now, $sampleType->name, $key),
                "tube_barcode" => $tube["tube_barcode"],
                "expire_date" => $tube["expire_date"],
                "packing_series" => $packingSeries,
            ]);
        }
        return $packingSeries;
    }

    public function updateMaterial(Material $material, MaterialDTO $materialDTO): Material
    {
        return $this->materialRepository->updateMaterial($material, $materialDTO->toArray());
    }

    /**
     * @throws Exception
     */
    public function deleteMaterial(Material $material): void
    {
        $this->materialRepository->deleteMaterial($material);
    }


    private function generateBarcode($date, $sampleType, $i): string
    {
        return Carbon::parse($date)->format("y") . ucfirst(substr($sampleType, 0, 1)) . (Carbon::now()->getTimestamp() + $i);
    }

    private function generatePackingSeries($sampleTypeName, Carbon $date): string
    {
        $prefix = implode("", array_map(fn($item) => strtoupper(substr($item, 0, 1)), explode(" ", $sampleTypeName)));
        return $prefix . "-" . $date->format("Y-m-d-") . $date->timestamp;
    }

    public function getMaterialsByPackingSeries(string $packingSeries): Collection
    {
        return $this->materialRepository->getAll(["filters" => ["packing_series" => $packingSeries]]);
    }

    public function isBarcodeAvailableToAssign($barcode,$sampleId): bool
    {
        return $this->materialRepository->isBarcodeAvailableToAssign($barcode,$sampleId);
    }

    public function getMaterialByBarcode($barcode)
    {
        return $this->materialRepository->getByBarcode($barcode);
    }
}
