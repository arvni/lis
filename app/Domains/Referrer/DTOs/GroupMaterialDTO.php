<?php

namespace App\Domains\Referrer\DTOs;

class GroupMaterialDTO
{
    public function __construct(
        public int   $sampleTypeId,
        public array $tubes,
    )
    {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            $data['sample_type_id'],
            $data['tubes'],);
    }

    public function toArray()
    {
        return [
            "sample_type_id"=>$this->sampleTypeId,
            "tubes"=>$this->tubes,
        ];
    }
}
