<?php

namespace App\Domains\Laboratory\Services;


use App\Domains\Laboratory\DTOs\BarcodeGroupDTO;
use App\Domains\Laboratory\Models\BarcodeGroup;
use App\Domains\Laboratory\Repositories\BarcodeGroupRepository;
use Exception;

class BarcodeGroupService
{
    public function __construct(private BarcodeGroupRepository $barcodeGroupRepository)
    {
    }

    public function listBarcodeGroups($queryData)
    {
        return $this->barcodeGroupRepository->ListBarcodeGroups($queryData);
    }

    public function storeBarcodeGroup(BarcodeGroupDTO $barcodeGroupDTO)
    {
        return $this->barcodeGroupRepository->creatBarcodeGroup($barcodeGroupDTO->toArray());
    }

    public function updateBarcodeGroup(BarcodeGroup $barcodeGroup, BarcodeGroupDTO $barcodeGroupDTO): BarcodeGroup
    {
        return $this->barcodeGroupRepository->updateBarcodeGroup($barcodeGroup, $barcodeGroupDTO->toArray());
    }

    /**
     * @throws Exception
     */
    public function deleteBarcodeGroup(BarcodeGroup $barcodeGroup): void
    {
        if (!$barcodeGroup->methods()->exists()) {
            $this->barcodeGroupRepository->deleteBarcodeGroup($barcodeGroup);
        } else
            throw new Exception("This barcode group has some Methods");
    }
}
