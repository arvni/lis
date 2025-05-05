<?php

namespace App\Domains\Referrer\DTOs;

class ReferrerOrderDTO
{
    public function __construct(
        public int          $referrerId,
        public string|array $orderInformation,
        public string       $status,
        public string       $reference_no,
        public string       $orderId,
        public string|array $logisticInformation,
        public ?string      $receivedAt,
        public ?int         $userId,
        public ?int         $patientId,
        public ?int         $acceptanceId,
    )
    {
    }

    public function toArray(): array
    {
        return [
            "orderInformation",
            "status",
            "reference_no",
            "order_id",
            "logisticInformation",
            "received_at",
            "acceptance_id",
            "user_id",
            "referrer_id",
            "patient_id",
        ];
    }
}
