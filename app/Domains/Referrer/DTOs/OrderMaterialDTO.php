<?php

namespace App\Domains\Referrer\DTOs;

use Carbon\Carbon;

class OrderMaterialDTO
{
    public function __construct(
        public int    $sampleTypeId,
        public int    $referrerId,
        public int    $serverId,
        public int    $amount,
        public string $status,
        public array  $materials
    )
    {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            $data['sample_type_id'],
            $data['referrer_id'],
            $data['server_id'],
            $data['amount'],
            $data['status'],
            $data["materials"] ?? []
        );
    }

    public function toArray(): array
    {
        return [
            "sample_type_id" => $this->sampleTypeId,
            "referrer_id" => $this->referrerId,
            "server_id" => $this->serverId,
            "amount" => $this->amount,
            "status" => $this->status,
            "materials" => $this->materials
        ];
    }
}
