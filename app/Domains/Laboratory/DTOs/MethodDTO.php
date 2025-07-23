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
        public ?array          $extra = null,
        public ?int            $noPatient = 1,
        public ?MethodPriceType $referrer_price_type = MethodPriceType::FIX,
        public ?int             $referrer_price = 0,
        public ?array          $referrer_extra = null,
        public ?int            $noSample = 1,
    )
    {
    }

    public function toArray()
    {
        return [
            "name" => $this->name,
            "status" => $this->status,
            "price_type" => $this->price_type,
            "referrer_price_type" => $this->referrer_price_type,
            "price" => $this->price,
            "referrer_price" => $this->referrer_price,
            "turnaround_time" => $this->turnaround_time,
            "referrer_extra" => $this->referrer_extra,
            "extra" => $this->extra,
            "barcode_group_id" => $this->barcodeGroupId,
            "workflow_id" => $this->workflowId,
            "no_patient" => $this->noPatient,
            "no_sample" => $this->noSample,
        ];
    }
}
