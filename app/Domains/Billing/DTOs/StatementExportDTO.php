<?php

namespace App\Domains\Billing\DTOs;

readonly class StatementExportDTO
{
    public function __construct(
        public array  $invoicesData,
        public array  $exportOptions,
        public string $filename,
    ) {}
}
