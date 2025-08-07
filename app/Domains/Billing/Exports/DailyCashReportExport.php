<?php

namespace App\Domains\Billing\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithCustomStartCell;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use Carbon\Carbon;

class DailyCashReportExport implements
    FromCollection,
    WithHeadings,
    WithMapping,
    WithStyles,
    WithTitle,
    WithCustomStartCell,
    WithEvents
{
    protected Carbon $date;
    protected Collection $data;
    protected array $summary;

    /**
     * Constructor
     * @param Collection $data Collection of report data
     * @param string|Carbon $date Report date
     */
    public function __construct($data, $date = null)
    {
        $this->data = $data;
        $this->date = $date ? Carbon::parse($date) : Carbon::now();
        $this->calculateSummary();
    }

    /**
     * Calculate summary totals
     */
    protected function calculateSummary(): void
    {
        $paid = $this->data->whereIn('payment_method', ['CASH','CARD'])->sum('prepayment');
        $notPaid = $this->data->where('payment_method', 'CREDIT')->sum('remaining');
        $transfer = $this->data->where('payment_method', 'TRANSFER')->sum('test_price');

        $this->summary = [
            'paid' => $paid,
            'not_paid' => $notPaid,
            'transfer' => $transfer
        ];
    }

    /**
     * @return Collection
     */
    public function collection()
    {
        return $this->data;
    }

    /**
     * Starting cell for data
     */
    public function startCell(): string
    {
        return 'B7'; // Start from B7 as per the original Excel
    }

    /**
     * Define the headings
     */
    public function headings(): array
    {
        return [
            'NO',
            'Test Name',
            'Patient Name',
            'Test Price',
            'Payment Method',
            'Discount',
            'Prepayment',
            'Remaining',
            'Receipt No',
            'Referrer'
        ];
    }

    /**
     * Map data for each row
     */
    public function map($row): array
    {
        static $index = 0;
        $index++;

        return [
            $index,
            $row["test_name"] ?? '',
            $row["patient_name"] ?? '',
            $row["test_price"] ?? 0,
            $row["payment_method"] ?? '',
            $row["discount"] ?? 0,
            $row["prepayment"] ?? null,
            $row["remaining"] ?? null,
            $row["receipt_no"] ?? '',
            $row["referrer"] ?? ''
        ];
    }

    /**
     * Apply styles to the worksheet
     */
    public function styles(Worksheet $sheet)
    {
        // Set column widths
        $sheet->getColumnDimension('A')->setWidth(5);
        $sheet->getColumnDimension('B')->setWidth(8);
        $sheet->getColumnDimension('C')->setWidth(25);
        $sheet->getColumnDimension('D')->setWidth(25);
        $sheet->getColumnDimension('E')->setWidth(15);
        $sheet->getColumnDimension('F')->setWidth(18);
        $sheet->getColumnDimension('G')->setWidth(12);
        $sheet->getColumnDimension('H')->setWidth(15);
        $sheet->getColumnDimension('I')->setWidth(15);
        $sheet->getColumnDimension('J')->setWidth(15);
        $sheet->getColumnDimension('K')->setWidth(20);

        // Style the header row
        $headerRow = 6;
        $sheet->getStyle("B{$headerRow}:K{$headerRow}")->applyFromArray([
            'font' => [
                'bold' => true,
                'size' => 11
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'E0E0E0']
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN
                ]
            ]
        ]);

        return [];
    }

    /**
     * Register events
     */
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();

                // Add title
                $sheet->setCellValue('B2', 'Daily Cash Report');
                $sheet->mergeCells('B2:D2');
                $sheet->getStyle('B2')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 16
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER
                    ]
                ]);

                // Add date
                $dateFormatted = $this->date->format('d/M/Y');
                $sheet->setCellValue('B4', "Date: {$dateFormatted}");
                $sheet->getStyle('B4')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 12
                    ]
                ]);

                // Add summary row at the bottom
                $lastRow = $sheet->getHighestRow();
                $summaryRow = $lastRow + 2;

                $summaryText = sprintf(
                    "PAID( %s RO) , NOT PAID (%sRO), TRANSFER (%sRO)",
                    number_format($this->summary['paid'], 2, '.', ''),
                    number_format($this->summary['not_paid'], 2, '.', ''),
                    number_format($this->summary['transfer'], 2, '.', '')
                );

                $sheet->setCellValue("F{$summaryRow}", $summaryText);
                $sheet->mergeCells("F{$summaryRow}:K{$summaryRow}");
                $sheet->getStyle("F{$summaryRow}")->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 11
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER
                    ],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => 'FFFF99']
                    ]
                ]);

                // Apply borders to data area
                $dataEndRow = $lastRow;
                $sheet->getStyle("B7:K{$dataEndRow}")->applyFromArray([
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN
                        ]
                    ]
                ]);

                // Format currency columns
                $sheet->getStyle("E7:E{$dataEndRow}")->getNumberFormat()
                    ->setFormatCode('#,##0.00');
                $sheet->getStyle("G7:I{$dataEndRow}")->getNumberFormat()
                    ->setFormatCode('#,##0.00');
            }
        ];
    }

    /**
     * Sheet title
     */
    public function title(): string
    {
        return $this->date->format("dD, d M Y");
    }
}
