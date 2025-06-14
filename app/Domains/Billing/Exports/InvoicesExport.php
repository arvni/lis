<?php

namespace App\Domains\Billing\Exports;

use App\Utils\Constants;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class InvoicesExport implements FromCollection
    , WithMapping
    , WithHeadings
    , ShouldAutoSize
    , WithStyles
{
    protected Collection $invoices;

    public function __construct(Collection $invoices)
    {
        $this->invoices = $invoices;
    }

    public function collection()
    {
        return $this->invoices;
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->setAutoFilter('A1:O1');
        return [
            1 => [
                'font' => [
                    'bold' => true,
                    'color' => [
                        "rgb" => "ffffff"
                    ]
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'color' => [
                        'rgb' => '0361ac',
                    ],
                ],
            ]
        ];

    }

    public function map($invoice): array
    {
        $rows = [];
        foreach ($invoice->acceptanceItems as $acceptanceItem) {
            $total = $acceptanceItem->price - $acceptanceItem->discount;
            $rows[] = [
                Carbon::parse($invoice->created_at)->toDate(),
                $invoice->invoiceNo,
                (string)optional($acceptanceItem->patient)->fullName,
                (string)optional($invoice->owner)->fullName,
                $acceptanceItem->test->name,
                $acceptanceItem->method->name,
                "$acceptanceItem->price",
                "$acceptanceItem->discount",
                "$total",
                "0",
                "0",
                "$total",
                "$total",
                $invoice->status,
                optional($acceptanceItem->patient)->nationality ? Constants::countries(optional($acceptanceItem->patient)->nationality) : "",
                ucfirst((string)optional($acceptanceItem->patient)->gender),
                optional($acceptanceItem->patient)->age,
                ucfirst((string)optional(optional($invoice->payments)[0])->paymentMethod?->value)
            ];
        }
        return $rows;
    }

    public function headings(): array
    {
        return [
            "Date",
            "Invoice No.",
            "Patient Name",
            "Client",
            "Test",
            "Method",
            "Rate(incl. vat)",
            "Discount",
            "Taxable",
            "VAT Amount",
            "VAT %",
            "Net Amount",
            "Patient Amount",
            "Status",
            "Nationality",
            "Gender",
            "Age",
            "Payment Method",
        ];
    }
}
