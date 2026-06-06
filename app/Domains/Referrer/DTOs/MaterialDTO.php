<?php

namespace App\Domains\Referrer\DTOs;

class MaterialDTO
{
    public function __construct(
        public int     $sampleTypeId,
        public string  $packingSeries,
        public ?string $tubeSeries,
        public string  $barcode,
        public ?string $tubeBarcode,
        public ?string $expireDate,
        public ?string $manufacturedDate,
        public ?string $assignedAt,
        public ?int    $referrerId,
    )
    {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            $data['sample_type']['id'] ?? $data['sample_type_id'],
            $data['packing_series'],
            $data['tube_series'] ?? null,
            $data['barcode'],
            $data['tube_barcode'] ?? null,
            $data['expire_date'] ?? null,
            $data['manufactured_date'] ?? null,
            $data['assigned_at'] ?? null,
            $data['referrer']['id'] ?? null,
        );
    }

    /**
     * Material's own columns. The referrer/assignment link
     * (order_material_id, assigned_at) is resolved in the service.
     */
    public function toArray(): array
    {
        return [
            "sample_type_id" => $this->sampleTypeId,
            "packing_series" => $this->packingSeries,
            "tube_series" => $this->tubeSeries,
            "barcode" => $this->barcode,
            "tube_barcode" => $this->tubeBarcode,
            "expire_date" => $this->expireDate,
            "manufactured_date" => $this->manufacturedDate,
        ];
    }
}
