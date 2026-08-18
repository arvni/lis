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
        public ?int              $collectRequestId = null,
        public ?bool             $needsAddSample = true,
        public ?bool             $pooling = false,
    )
    {
    }

    /**
     * Every column toArray() writes back must be read here — a field left out
     * falls back to its constructor default, so round-tripping an order through
     * the DTO would silently reset it (pooling to false, collect_request_id to
     * null, needs_add_sample to true).
     */
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
            $data['collect_request_id'] ?? null,
            $data['needs_add_sample'] ?? true,
            $data['pooling'] ?? false,
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
            "collect_request_id" => $this->collectRequestId,
            "pooling" => $this->pooling,
            "needs_add_sample" => $this->needsAddSample,
        ];
    }
}
