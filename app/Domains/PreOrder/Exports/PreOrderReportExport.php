<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Exports;

use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

/** The pre-order reports as one workbook, a sheet per report. */
class PreOrderReportExport implements WithMultipleSheets
{
    use Exportable;

    public const TITLES = [
        'by_stage' => 'Open by stage',
        'days_per_stage' => 'Days per stage',
        'approval_time' => 'Center approval time',
        'drop_offs' => 'Drop-offs',
        'pgt_batches' => 'Batches per PGT case',
    ];

    /** @param  array<string, list<array<string, mixed>>>  $reports */
    public function __construct(private readonly array $reports) {}

    /** @return list<PreOrderReportSheet> */
    public function sheets(): array
    {
        $sheets = [];
        foreach (self::TITLES as $key => $title) {
            $sheets[] = new PreOrderReportSheet($title, $this->reports[$key] ?? []);
        }

        return $sheets;
    }
}
