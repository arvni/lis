<?php

namespace App\Domains\Referrer\Services;


use App\Domains\Laboratory\Services\SampleTypeService;
use App\Domains\Referrer\DTOs\GroupMaterialDTO;
use App\Domains\Referrer\DTOs\MaterialDTO;
use App\Domains\Referrer\Enums\OrderMaterialStatus;
use App\Domains\Referrer\Models\Material;
use App\Domains\Referrer\Models\OrderMaterial;
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

    public function listMaterials(array $queryData): LengthAwarePaginator
    {
        return $this->materialRepository->ListMaterials($queryData);
    }

    public function listPackingSeriesMaterials(array $queryData): LengthAwarePaginator
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
                "tube_series" => $tube["tube_series"] ?? null,
                "expire_date" => $tube["expire_date"],
                "manufactured_date" => $tube["manufactured_date"] ?? null,
                "packing_series" => $packingSeries,
            ]);
        }
        return $packingSeries;
    }

    public function updateMaterial(Material $material, MaterialDTO $materialDTO): Material
    {
        $data = $materialDTO->toArray();

        if ($materialDTO->referrerId) {
            // Assigned to a referrer: link to that referrer's order material for
            // the same sample type, then stamp the assignment date.
            $orderMaterial = $this->resolveOrderMaterial($material, $materialDTO->referrerId, $materialDTO->sampleTypeId);
            $data['order_material_id'] = $orderMaterial->id;
            $data['assigned_at'] = $materialDTO->assignedAt
                ? Carbon::parse($materialDTO->assignedAt)
                : ($material->assigned_at ?? Carbon::now('Asia/Muscat'));
        } else {
            // No referrer: material is unassigned.
            $data['order_material_id'] = null;
            $data['assigned_at'] = null;
        }

        return $this->materialRepository->updateMaterial($material, $data);
    }

    /**
     * Find (or create) the order material that links this material to the given
     * referrer + sample type. Created directly so provider webhooks are not fired
     * for an administrative reassignment.
     */
    private function resolveOrderMaterial(Material $material, int $referrerId, int $sampleTypeId): OrderMaterial
    {
        $current = $material->orderMaterial;
        if ($current && $current->referrer_id === $referrerId && $current->sample_type_id === $sampleTypeId) {
            return $current;
        }

        return OrderMaterial::query()
            ->where('referrer_id', $referrerId)
            ->where('sample_type_id', $sampleTypeId)
            ->latest('id')
            ->firstOr(fn() => OrderMaterial::query()->create([
                'referrer_id' => $referrerId,
                'sample_type_id' => $sampleTypeId,
                'server_id' => auth()->id() ?? 0,
                'amount' => 1,
                'status' => OrderMaterialStatus::PROCESSED->value,
            ]));
    }

    /**
     * @throws Exception
     */
    public function deleteMaterial(Material $material): void
    {
        $this->materialRepository->deleteMaterial($material);
    }


    private function generateBarcode(mixed $date, string $sampleType, int $i): string
    {
        return Carbon::parse($date)->format("y") . ucfirst(substr($sampleType, 0, 1)) . (Carbon::now()->getTimestamp() + $i);
    }

    private function generatePackingSeries(string $sampleTypeName, Carbon $date): string
    {
        $prefix = implode("", array_map(fn($item) => strtoupper(substr($item, 0, 1)), explode(" ", $sampleTypeName)));
        return $prefix . "-" . $date->format("Y-m-d-") . $date->timestamp;
    }

    public function getMaterialsByPackingSeries(string $packingSeries): Collection
    {
        return $this->materialRepository->getAll(["filters" => ["packing_series" => $packingSeries]]);
    }

    public function isBarcodeAvailableToAssign(string $barcode, int|string $sampleId): bool
    {
        return $this->materialRepository->isBarcodeAvailableToAssign($barcode,$sampleId);
    }

    public function getMaterialByBarcode(string $barcode)
    {
        return $this->materialRepository->getByBarcode($barcode);
    }
}
