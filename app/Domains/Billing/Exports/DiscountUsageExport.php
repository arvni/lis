<?php

declare(strict_types=1);

namespace App\Domains\Billing\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * One row per discounted test. No patient identity by design — a bearer card
 * never carried any, and this is a finance report.
 */
class DiscountUsageExport implements FromCollection, ShouldAutoSize, WithHeadings, WithMapping, WithStyles
{
    /**
     * @param  Collection<int, \stdClass>  $rows
     */
    public function __construct(private readonly Collection $rows) {}

    public function collection(): Collection
    {
        return $this->rows;
    }

    /**
     * @return list<string>
     */
    public function headings(): array
    {
        return [
            'Applied At',
            'Partner',
            'Card Number',
            'Acceptance',
            'Reference Code',
            'Test',
            'Offer',
            'Discount',
        ];
    }

    /**
     * @param  \stdClass  $row
     * @return list<mixed>
     */
    public function map($row): array
    {
        return [
            $row->applied_at,
            $row->partner_name,
            $row->card_number,
            $row->acceptance_id,
            $row->reference_code,
            $row->test_name,
            $row->offer_title,
            (float) $row->amount,
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function styles(Worksheet $sheet): array
    {
        $sheet->setAutoFilter('A1:H1');

        return [
            '1' => ['font' => ['bold' => true]],
        ];
    }
}
