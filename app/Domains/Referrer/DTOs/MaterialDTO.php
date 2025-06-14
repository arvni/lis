<?php

namespace App\Domains\Referrer\DTOs;

use Carbon\Carbon;

class MaterialDTO
{
    public function __construct(
        public int     $sampleTypeId,
        public string  $barcode,
        public int     $no,
        public ?string $tubeBarcode,
        public ?string $expireDate,
        public ?int    $referrerId,
        public Carbon  $assignedAt,
        public ?int    $sample_id,
    )
    {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            $data['sample_type_id'],
            $data['barcode'],
            $data['no'],
            $data['tube_barcode'] ?? null,
            $data['expire_date'] ?? null,
            $data['referrer_id'] ?? null,
            ($data['assigned_at'] ?? null) ? Carbon::parse($data['assigned_at']) : null,
            $data['sample_id'] ?? null,);
    }

    public function toArray(): array
    {
        return [
            "sample_type_id" => $this->sampleTypeId,
            "referrer_id" => $this->referrerId,
            "sample_id" => $this->sample_id,
            "no" => $this->no,
            "barcode" => $this->barcode,
            "tube_barcode" => $this->tubeBarcode,
            "expire_date" => $this->expireDate,
            "assigned_at" => $this->assignedAt,
        ];
    }
}
