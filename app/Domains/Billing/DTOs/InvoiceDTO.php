<?php

namespace App\Domains\Billing\DTOs;


class InvoiceDTO
{
    public function __construct(public string $ownerType,
                                public int $ownerId,
                                public int $userId,
                                public int $discount=0
    )
    {
    }

    public function toArray(): array
    {
        return [
            "owner_type"=>$this->ownerType,
            "owner_id"=>$this->ownerId,
            "user_id"=>$this->userId,
            "discount"=>$this->discount
        ];
    }
}
