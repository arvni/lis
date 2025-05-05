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
        public array           $patients,
        public ?array          $timeline,
        public int|string|null $id = null
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
            'patients' => $this->patients,
            'timeline' => $this->timeline,
        ];
        return $data;
    }
}
