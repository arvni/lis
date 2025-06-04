<?php

namespace App\Domains\Laboratory\Services;


use App\Domains\Laboratory\DTOs\GroupMaterialDTO;
use App\Domains\Laboratory\DTOs\MaterialDTO;
use App\Domains\Laboratory\Models\Material;
use App\Domains\Laboratory\Repositories\MaterialRepository;
use Carbon\Carbon;
use Exception;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class MaterialService
{
    public function __construct(private readonly MaterialRepository $materialRepository, private readonly SampleTypeService $sampleTypeService)
    {
    }

    public function listMaterials($queryData): LengthAwarePaginator
    {
        return $this->materialRepository->ListMaterials($queryData);
    }

    public function storeMaterial(GroupMaterialDTO $groupMaterialDTO): string
    {
        $sampleType = $this->sampleTypeService->getSampleTypeById($groupMaterialDTO->sampleTypeId);
        $now = Carbon::now();
        $packingSeries=$this->generatePackingSeries($sampleType);
        foreach ($groupMaterialDTO->tubes as $key => $tube) {
            $this->materialRepository->creatMaterial([
                "sample_type_id" => $groupMaterialDTO->sampleTypeId,
                "barcode" => $this->generateBarcode($now, $sampleType, $key),
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

    private function generatePackingSeries($sampleTypeName,Carbon $date): string
    {
        $prefix=explode(" ", $sampleTypeName);
        return Str::kebab($sampleTypeName) . $date->format("Y-m-d-H-i-s");
    }

}
