<?php

namespace App\Domains\Reception\DTOs;

use App\Domains\Reception\Enums\AcceptanceItemStateStatus;
use App\Domains\Reception\Models\AcceptanceItemState;

class AcceptanceItemStateDTO
{
    public function __construct(
        public int     $acceptanceItemId,
        public int     $sectionId,
        public         $parameters,
        public AcceptanceItemStateStatus  $status,
        public int     $order = 0,
        public bool    $isFirstSection = false,
        public string  $details = "",
        public ?int    $userId = null,
        public ?int    $startedById = null,
        public ?int    $finishedById = null,
        public ?string $startedAt = null,
        public ?string $finishedAt = null,

    )
    {
    }

    public Static function fromAcceptanceItemState(AcceptanceItemState $acceptanceItemState): AcceptanceItemStateDTO
    {
        return new Self(
            $acceptanceItemState->acceptance_item_id,
            $acceptanceItemState->section_id,
            $acceptanceItemState->parameters,
            $acceptanceItemState->status,
            $acceptanceItemState->order,
            $acceptanceItemState->is_first_section,
            $acceptanceItemState->details||"",
            $acceptanceItemState->user_id,
            $acceptanceItemState->started_by_id,
            $acceptanceItemState->finished_by_id,
            $acceptanceItemState->started_at,
            $acceptanceItemState->finished_at

        );
    }
    public function toArray(): array
    {
        $data = [
            "acceptance_item_id" => $this->acceptanceItemId,
            "section_id" => $this->sectionId,
            "user_id" => $this->userId ?? auth()->user()->id,
            "parameters" => $this->parameters,
            "details" => $this->details,
            "status" => $this->status,
            "is_first_section" => $this->isFirstSection,
            "started_at" => $this->startedAt,
            "finished_at" => $this->finishedAt,
            "finished_by_id" => $this->finishedById,
            "started_by_id" => $this->startedById,
            "order" => $this->order,
        ];
        return $data;
    }
}
