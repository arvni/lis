<?php

namespace App\Domains\Laboratory\DTOs;

class ReportTemplateDTO
{
    public function __construct(
        public string $name,
        public array  $template,
        public array  $parameters
    )
    {
    }

    public function toArray()
    {
        return [
            "name" => $this->name,
            "template" => $this->template,
            "parameters" => $this->parameters
        ];
    }
}
