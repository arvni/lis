<?php

namespace App\Domains\Billing\DTOs;


use App\Domains\Billing\Enums\InvoiceStatus;

class InvoiceDTO
{
    public function __construct(public string        $ownerType,
                                public int           $ownerId,
                                public int           $userId,
                                public InvoiceStatus $status = InvoiceStatus::WAITING_FOR_PAYMENT,
                                public int           $discount = 0,
    )
    {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            $data['owner_type'],
            $data['owner_id'],
            $data['user_id'],
            InvoiceStatus::find($data['status'])?? InvoiceStatus::WAITING_FOR_PAYMENT,
            $data['discount']??0
        );
    }

    public function toArray(): array
    {
        return [
            "owner_type" => $this->ownerType,
            "owner_id" => $this->ownerId,
            "user_id" => $this->userId,
            "discount" => $this->discount,
            "status" => $this->status
        ];
    }
}
