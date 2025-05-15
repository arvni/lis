<?php

namespace App\Domains\Reception\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Maatwebsite\Excel\Concerns\WithCustomStartCell;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use Carbon\Carbon;

class DailyReceptionReportExport implements FromCollection, WithHeadings, WithTitle, WithStyles, WithColumnWidths, WithCustomStartCell, WithEvents
{
    protected array $report;

    public function __construct(array $report)
    {
        $this->report = $report;
    }

    /**
     * @return \Illuminate\Support\Collection
     */
    public function collection()
    {
        // Get all patients for the report
        $items = collect($this->report["acceptanceItems"])->sortBy('created_at');

        return $items->map(function ($item,$index) {
            return [
                $index+1,
                $item->acceptanceItems->map(fn($acceptanceItem)=>$acceptanceItem->test->name)->unique()->reduce(fn($a,$b)=>$a.", ".$b),
                $item->patient->fullName,
                $item->acceptanceItems->map(fn($acceptanceItem)=>$acceptanceItem->price)->sum(),
                $item->payments->map(fn($payment)=>$payment->paymentMethod)->unique()->reduce(fn($a,$b)=>$a.", ".$b,""),
                $item->acceptanceItems->map(fn($acceptanceItem)=>$acceptanceItem->price)->sum(),
                $item->payments->map(fn($payment)=>$payment->price)->reduce(fn($a,$b)=>$a+$b,0),
                $item->referenceCode,
                $item->referrer->fullName,
            ];
        });
    }

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
            'Referrer',
        ];
    }

    public function title(): string
    {
        return 'Sheet1';
    }

    public function startCell(): string
    {
        return 'B6';
    }

    public function styles(Worksheet $sheet)
    {
        // Apply styles to the entire sheet
        $sheet->getStyle('B6:K6')->getFont()->setBold(true);

        // Set border for all cells in the data range
        $lastRow = $sheet->getHighestRow();
        $sheet->getStyle('B6:K' . $lastRow)->getBorders()->getAllBorders()->setBorderStyle('thin');

        // Set header and title styles
        $sheet->getStyle('B2')->getFont()->setBold(true)->setSize(14);
        $sheet->getStyle('B4')->getFont()->setBold(true);

        // Add title and date
        $sheet->setCellValue('B2', 'Daily Cash Report');

        $formattedDate = Carbon::parse($this->report->report_date)->format('d/M/Y');
        $sheet->setCellValue('B4', 'Date: ' . $formattedDate);

        // Add summary statistics
        $summaryRow = $lastRow + 2;
        $sheet->setCellValue('B' . $summaryRow, 'PAID(' . $this->report->total_paid . ' RO) , NOT PAID (' . $this->report->total_not_paid . 'RO), TRANSFER (' . $this->report->total_transfer . 'RO)');

        // Add number of patients
        $sheet->setCellValue('B' . ($summaryRow + 2), 'Number of Patients: ' . $this->report->patients->count());

        // Add prepared by
        $sheet->setCellValue('B' . ($summaryRow + 5), 'Done By: ' . $this->report->prepared_by);

        return [
            // Set additional styles as needed
            'B6:K6' => [
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => [
                        'rgb' => 'F0F0F0',
                    ],
                ],
            ],
        ];
    }

    public function columnWidths(): array
    {
        return [
            'B' => 5,
            'C' => 20,
            'D' => 30,
            'E' => 10,
            'F' => 15,
            'G' => 10,
            'H' => 15,
            'I' => 15,
            'J' => 15,
            'K' => 25,
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                // Perform additional operations after the sheet is created
                $lastRow = $event->sheet->getHighestRow();

                // Apply text wrap for patient names and referrer columns
                $event->sheet->getStyle('D7:D' . $lastRow)->getAlignment()->setWrapText(true);
                $event->sheet->getStyle('K7:K' . $lastRow)->getAlignment()->setWrapText(true);

                // Center certain columns
                $event->sheet->getStyle('B6:B' . $lastRow)->getAlignment()->setHorizontal('center');
                $event->sheet->getStyle('E6:J' . $lastRow)->getAlignment()->setHorizontal('center');

                // Set the print area
                $event->sheet->getPageSetup()->setPrintArea('B2:K' . ($lastRow + 10));

                // Merge cells for title and summary
                $event->sheet->mergeCells('B2:K2');
                $event->sheet->mergeCells('B' . ($lastRow + 2) . ':G' . ($lastRow + 2)); // Summary line
                $event->sheet->mergeCells('B' . ($lastRow + 4) . ':E' . ($lastRow + 4)); // Number of patients
            },
        ];
    }
}
