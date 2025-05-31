<?php

namespace App\Domains\Referrer\DTOs;

class ReferrerOrderDTO
{
    public function __construct(
        public int               $referrerId,
        public string            $orderId,
        public string|array      $orderInformation,
        public string            $status,
        public ?string           $reference_no = null,
        public ?int              $userId = null,
        public string|array|null $logisticInformation = null,
        public ?string           $receivedAt = null,
        public ?int              $patientId = null,
        public ?int              $acceptanceId = null,
    )
    {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            $data['referrer_id'],
            $data['order_id'],
            $data['orderInformation'],
            $data['status'],
            $data['reference_no'],
            $data['user_id'],
            $data['logisticInformation'],
            $data['received_at'],
            $data['patient_id'],
            $data['acceptance_id'],
        );
    }

    public function toArray(): array
    {
        return [
            "orderInformation" => $this->orderInformation,
            "status" => $this->status,
            "reference_no" => $this->reference_no,
            "order_id" => $this->orderId,
            "logisticInformation" => $this->logisticInformation,
            "received_at" => $this->receivedAt,
            "acceptance_id" => $this->acceptanceId,
            "user_id" => $this->userId,
            "referrer_id" => $this->referrerId,
            "patient_id" => $this->patientId,
        ];
    }
}
