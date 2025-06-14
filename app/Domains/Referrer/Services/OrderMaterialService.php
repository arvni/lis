<?php

namespace App\Domains\Referrer\Services;

use App\Domains\Referrer\DTOs\OrderMaterialDTO;
use App\Domains\Referrer\Models\OrderMaterial;
use App\Domains\Referrer\Repositories\MaterialRepository;
use App\Domains\Referrer\Repositories\OrderMaterialRepository;
use Carbon\Carbon;
use Exception;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

readonly class OrderMaterialService
{
    public function __construct(
        private OrderMaterialRepository $orderMaterialRepository,
        private MaterialRepository      $materialRepository,
    )
    {
    }

    public function listOrderMaterials($queryData): LengthAwarePaginator
    {
        return $this->orderMaterialRepository->ListOrderMaterials($queryData);
    }

    public function updateOrderMaterial(OrderMaterial $orderMaterial, OrderMaterialDTO $orderMaterialDTO): OrderMaterial
    {
        $updatedOrderMaterial = $this->orderMaterialRepository->updateOrderMaterial($orderMaterial, Arr::except($orderMaterialDTO->toArray(), 'materials'));
        DB::transaction(function () use ($updatedOrderMaterial, $orderMaterialDTO) {
            foreach ($orderMaterialDTO->materials as $materialData) {
                $material = $this->materialRepository->getById($materialData["id"]);
                $this->materialRepository->updateMaterial($material, [
                    "order_material_id" => $updatedOrderMaterial->id,
                    "assigned_at" => Carbon::now("Asia/Muscat")
                ]);
            }
        });
        return $updatedOrderMaterial;
    }

    /**
     * @throws Exception
     */
    public function deleteOrderMaterial(OrderMaterial $orderMaterial): void
    {
        $orderMaterial->materials()->update(["assigned_at" => null]);
        $this->orderMaterialRepository->deleteOrderMaterial($orderMaterial);
    }

    public function loadForEdit(OrderMaterial $orderMaterial): OrderMaterial
    {
        return $orderMaterial->load(["materials"])
            ->loadAggregate("referrer", "fullName")
            ->loadAggregate("sampleType", "name");
    }

}
