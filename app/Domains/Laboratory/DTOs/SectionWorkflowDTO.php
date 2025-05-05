<?php

namespace App\Domains\Laboratory\DTOs;

class SectionWorkflowDTO
{
    public function __construct(
        public int $sectionId,
        public int $workflowId,
        public array $parameters,
        public int|string $order
    )
    {
    }

    public function toArray(): array
    {
        return [
            "section_id" => $this->sectionId,
            "workflow_id" => $this->workflowId,
            "parameters" => $this->parameters,
            "order" => $this->order
        ];
    }
}
