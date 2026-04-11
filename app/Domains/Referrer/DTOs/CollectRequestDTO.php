<?php

namespace App\Domains\Referrer\DTOs;

class CollectRequestDTO
{
    public function __construct(
        public int          $sample_collector_id,
        public int          $referrer_id,
        public ?string      $preferred_date = null,
        public ?string      $note = null,
        public string|array $logistic_information = [],
        public ?string      $status = null,
        public ?string      $barcode = null,
    )
    {
    }

    public function toArray(): array
    {
        $data = [
            "sample_collector_id"  => $this->sample_collector_id,
            "referrer_id"          => $this->referrer_id,
            "preferred_date"       => $this->preferred_date,
            "note"                 => $this->note,
            "logistic_information" => $this->logistic_information,
            "barcode"              => $this->barcode,
        ];

        if ($this->status !== null) {
            $data['status'] = $this->status;
        }

        return $data;
    }
}
