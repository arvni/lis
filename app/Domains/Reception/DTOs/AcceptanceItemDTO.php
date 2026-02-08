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
        public int|string|null $panelId = null,
        public bool            $deleted = false,
        public bool            $sampleless = false,
        public                 $reportless = false
    )
    {
    }

    public function toArray(): array
    {
        return [
            'acceptance_id' => $this->acceptanceId,
            'method_test_id' => $this->methodTestId,
            'price' => $this->price,
            'discount' => $this->discount,
            'customParameters' => $this->customParameters,
            'timeline' => $this->timeline,
            'no_sample' => $this->sampleless ? 0 : $this->noSample,
            "id" => $this->id,
            "panel_id" => $this->panelId,
            "deleted" => $this->deleted,
            "sampleless" => $this->sampleless,
            "reportless" => $this->reportless || $this->sampleless
        ];
    }
}
