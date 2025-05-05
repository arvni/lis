<?php

namespace App\Domains\Laboratory\DTOs;

use App\Domains\Laboratory\Enums\MethodPriceType;

class MethodDTO
{
    public function __construct(
        public string          $name,
        public ?int            $barcodeGroupId,
        public ?int            $workflowId,
        public bool            $status = true,
        public MethodPriceType $price_type = MethodPriceType::FIX,
        public int             $price = 0,
        public ?int            $turnaround_time = null,
        public ?array          $requirements = null,
        public ?array          $extra = null,
        public ?int            $noPatient = 1
    )
    {
    }

    public function toArray()
    {
        return [
            "name" => $this->name,
            "status" => $this->status,
            "price_type" => $this->price_type,
            "price" => $this->price,
            "turnaround_time" => $this->turnaround_time,
            "requirements" => $this->requirements,
            "extra" => $this->extra,
            "barcode_group_id" => $this->barcodeGroupId,
            "workflow_id" => $this->workflowId,
            "no_patient" => $this->noPatient
        ];
    }
}
