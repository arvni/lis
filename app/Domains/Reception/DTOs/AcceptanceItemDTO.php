<?php

namespace App\Domains\Reception\DTOs;

use App\Domains\Reception\Models\AcceptanceItem;

class AcceptanceItemDTO
{
    public function __construct(
        public int             $acceptanceId,
        public int             $methodTestId,
        public float           $price,
        public float           $discount,
        public array           $customParameters,
        public ?array          $timeline,
        public int             $noSample = 1,
        public int|string|null $id = null,
        public int|string|null $panelId = null
    )
    {
    }

    public function toArray(): array
    {
        $data = [
            'acceptance_id' => $this->acceptanceId,
            'method_test_id' => $this->methodTestId,
            'price' => $this->price,
            'discount' => $this->discount,
            'customParameters' => $this->customParameters,
            'timeline' => $this->timeline,
            'no_sample' => $this->noSample,
            "id" => $this->id,
            "panel_id" => $this->panelId,
        ];
        return $data;
    }
}
