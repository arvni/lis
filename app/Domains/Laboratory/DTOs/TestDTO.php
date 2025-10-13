<?php

namespace App\Domains\Laboratory\DTOs;

use App\Domains\Laboratory\Enums\MethodPriceType;
use App\Domains\Laboratory\Enums\TestType;
use Illuminate\Support\Arr;

class TestDTO
{
    public function __construct(
        public string          $name,
        public TestType        $type,
        public string          $code,
        public string          $fullName,
        public ?string         $description,
        public bool            $status = true,
        public ?array          $report_templates = [],
        public ?int            $requestFormId = null,
        public ?int            $instructionId = null,
        public ?int            $consentFormId = null,
        public ?int            $price = 0,
        public ?int            $referrerPrice = 0,
        public MethodPriceType $priceType = MethodPriceType::FIX,
        public MethodPriceType $referrerPriceType = MethodPriceType::FIX,
        public ?array          $extra = null,
        public ?array          $referrerExtra = null,
        public ?bool           $canMerge = true,
    )
    {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            $data["name"],
            $existingType ?? TestType::from($data["type"]),
            $data["code"],
            $data["fullName"],
            $data["description"],
            $data["status"] ?? true,
            $data["report_templates"] ?? [],
            $data["request_form"]["id"] ?? null,
            $data["instruction"]["id"] ?? null,
            $data["consent_form"]["id"] ?? null,
            $data["price"] ?? 0,
            $data["referrer_price"] ?? 0,
            self::resolvePriceType($data["price_type"] ?? null),
            self::resolvePriceType($data["referrer_price_type"] ?? null),
            $data["extra"] ?? null,
            $data["referrer_extra"] ?? null,
            $data["can_merge"] ?? null,);
    }

    public function toArray()
    {
        return [
            "name" => $this->name,
            "type" => $this->type,
            "code" => $this->code,
            "fullName" => $this->fullName,
            "description" => $this->description,
            "status" => $this->status,
            "report_templates" => $this->report_templates,
            "price" => $this->price,
            "referrer_price" => $this->referrerPrice,
            "request_form_id" => $this->requestFormId,
            "instruction_id" => $this->instructionId,
            "consent_form_id" => $this->consentFormId,
            "price_type" => $this->priceType,
            "referrer_price_type" => $this->referrerPriceType,
            "extra" => $this->extra,
            "referrer_extra" => $this->referrerExtra,
            "can_merge" => $this->canMerge,
        ];
    }

    public static function resolvePriceType(?string $priceType): MethodPriceType
    {
        return $priceType ? MethodPriceType::find($priceType) : MethodPriceType::FIX;
    }
}
