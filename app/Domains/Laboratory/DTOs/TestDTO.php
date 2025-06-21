<?php

namespace App\Domains\Laboratory\DTOs;

use App\Domains\Laboratory\Enums\TestType;

class TestDTO
{
    public function __construct(
        public int      $test_group_id,
        public string   $name,
        public TestType $type,
        public string   $code,
        public string   $fullName,
        public ?string  $description,
        public bool     $status = true,
        public ?array     $report_templates = [],
        public ?int $requestFormId,
        public ?int $instructionId,
        public ?int     $consentFormId,
        public ?int     $price = 0,
    )
    {
    }

    public function toArray()
    {
        return [
            "test_group_id" => $this->test_group_id,
            "name" => $this->name,
            "type" => $this->type,
            "code" => $this->code,
            "fullName" => $this->fullName,
            "description" => $this->description,
            "status" => $this->status,
            "report_templates" => $this->report_templates,
            "price" => $this->price,
            "request_form_id" => $this->requestFormId,
            "instruction_id" => $this->instructionId,
            "consent_form_id" => $this->consentFormId,
        ];
    }
}
