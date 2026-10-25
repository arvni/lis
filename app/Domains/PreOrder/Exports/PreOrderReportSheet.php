<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;

/** One report's rows; the headings are its column names. */
class PreOrderReportSheet implements FromArray, ShouldAutoSize, WithHeadings, WithTitle
{
    /** @param  list<array<string, mixed>>  $rows */
    public function __construct(private readonly string $title, private readonly array $rows) {}

    /** @return list<list<mixed>> */
    public function array(): array
    {
        return array_map(fn (array $row) => array_values($row), $this->rows);
    }

    /** @return list<string> */
    public function headings(): array
    {
        return array_map(fn (string $key) => ucfirst(str_replace('_', ' ', $key)), array_keys($this->rows[0] ?? []));
    }

    public function title(): string
    {
        return $this->title;
    }
}
