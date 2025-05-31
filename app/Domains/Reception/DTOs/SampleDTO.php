<?php

namespace App\Domains\Reception\DTOs;

class SampleDTO
{
    public function __construct(
        public int     $patientId,
        public int     $sampleTypeId,
        public int     $samplerId,
        public string  $sampleLocation,
        public string  $collectionDate,
        public array   $acceptanceItems,
        public ?string $status,
        public array   $barcodeGroup,
        public ?string $barcode = null,
    )
    {
    }

    public static function fromArray(array $data): SampleDTO
    {
        return new self(
            patientId: $data['patient']['id'] ?? null,
            sampleTypeId: $data['sampleType']['id'] ?? $data['sampleType'] ?? null,
            samplerId: $data['sampler_id'] ?? auth()->user()->id,
            sampleLocation: $data['sampleLocation'] ?? null,
            collectionDate: $data['collection_date'] ?? null,
            acceptanceItems: $data['items'] ?? null,
            status: $data['status'] ?? null,
            barcodeGroup: $data['barcodeGroup'] ?? null,
            barcode: $data['barcode'] ?? null,
        );
    }

    public function toArray(): array
    {
        return [
            "patient_id" => $this->patientId,
            "sample_type_id" => $this->sampleTypeId,
            "sampler_id" => $this->samplerId,
            "sampleLocation" => $this->sampleLocation,
            "collection_date" => $this->collectionDate,
            "acceptance_items" => $this->acceptanceItems,
            "status" => $this->status,
            "barcodeGroup" => $this->barcodeGroup,
            "barcode" => $this->barcode,
        ];
    }
}
