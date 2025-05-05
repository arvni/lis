<?php

namespace App\Domains\Laboratory\DTOs;

use App\Domains\Laboratory\Enums\OfferType;

class OfferDTO
{
    public function __construct(
        public string    $title,
        public string   $description,
        public OfferType $type,
        public float     $amount,
        public ?array    $tests = [],
        public ?array    $referrers = [],
        public bool      $active = true,
        public ?string   $started_at = null,
        public ?string   $ended_at = null,
    )
    {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            $data["title"],
            $data["description"],
            OfferType::find($data["type"]),
            $data["amount"],
            $data["tests"] ?? [],
            $data["referrers"] ?? [],
            $data["active"],
            $data["started_at"] ?? null,
            $data["ended_at"] ?? null,);
    }

    public function toArray()
    {
        return [
            "title" => $this->title,
            "description" => $this->description,
            "type" => $this->type,
            "amount" => $this->amount,
            "tests" => $this->tests || [],
            "referrers" => $this->referrers || [],
            "active" => $this->active,
            "started_at" => $this->started_at,
            "ended_at" => $this->ended_at,
        ];
    }
}
