<?php

namespace App\Domains\Referrer\DTOs;

class CollectRequestDTO
{
    public function __construct(
        public int          $sample_collector_id,
        public int          $referrer_id,
        public string|array $logistic_information = [],
        public ?string      $status = null
    )
    {
    }

    public function toArray(): array
    {
        $data = [
            "sample_collector_id" => $this->sample_collector_id,
            "referrer_id" => $this->referrer_id,
            "logistic_information" => $this->logistic_information,
        ];

        // Only include status if provided
        if ($this->status !== null) {
            $data['status'] = $this->status;
        }

        return $data;
    }
}
