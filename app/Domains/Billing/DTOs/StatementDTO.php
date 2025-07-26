<?php

namespace App\Domains\Billing\DTOs;

class StatementDTO
{
    public function __construct(
        public int    $referrerId,
        public string $issueDate,
        public array  $invoices,
    )
    {
    }

    public static function fromRequest($data): self
    {
        return new self(
            referrerId: $data['referrer']['id'] ?? $data['referrer_id'],
            issueDate: $data['issue_date'],
            invoices: $data['invoices'],
        );
    }

    public function toArray(): array
    {
        return [
            "referrer_id" => $this->referrerId,
            "issue_date" => $this->issueDate,
            "invoices" => $this->invoices,
        ];
    }
}
