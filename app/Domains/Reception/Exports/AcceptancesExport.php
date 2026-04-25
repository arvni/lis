<?php

namespace App\Domains\Reception\Exports;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class AcceptancesExport implements
    FromCollection,
    WithHeadings,
    WithMapping,
    ShouldAutoSize,
    WithStyles
{
    private const TIMEZONE     = 'Asia/Muscat';
    private const HEADER_COLOR = '0361ac';
    private const HEADER_TEXT  = 'ffffff';

    public function __construct(private readonly Collection $acceptances) {}

    public function collection(): Collection
    {
        return $this->acceptances;
    }

    public function headings(): array
    {
        return [
            'ID',
            'Patient Name',
            'Patient ID',
            'Referrer',
            'Barcodes',
            'Out-Patient',
            'Remaining (OMR)',
            'Status',
            'Est. Report Date',
            'Registered At',
            'Published At',
        ];
    }

    public function map($row): array
    {
        $remaining = ($row->payable_amount ?? 0) - ($row->payments_sum_price ?? 0);

        $reportDate = null;
        if ($row->report_date && $row->created_at) {
            $reportDate = Carbon::parse($row->created_at, self::TIMEZONE)
                ->addDays((int) $row->report_date)
                ->toDateString();
        }

        $barcodes = collect($row->samples ?? [])->pluck('barcode')->filter()->join(', ');

        return [
            $row->id,
            $row->patient_fullname,
            $row->patient_idno,
            $row->referrer_fullname,
            $barcodes,
            $row->out_patient ? 'Out-Patient' : 'In-Patient',
            number_format((float) $remaining, 3),
            $row->status instanceof \BackedEnum ? $row->status->value : $row->status,
            $reportDate ?? '',
            $this->formatDateTime($row->created_at),
            $row->published_at ? $this->formatDateTime($row->published_at) : '',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        $sheet->setAutoFilter('A1:K1');

        return [
            1 => [
                'font' => [
                    'bold'  => true,
                    'color' => ['rgb' => self::HEADER_TEXT],
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'color'    => ['rgb' => self::HEADER_COLOR],
                ],
            ],
        ];
    }

    private function formatDateTime($value): string
    {
        if (!$value) return '';
        return Carbon::parse($value, self::TIMEZONE)->format('Y-m-d H:i');
    }
}
