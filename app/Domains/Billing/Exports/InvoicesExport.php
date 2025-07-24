<?php

namespace App\Domains\Billing\Exports;

use App\Domains\Laboratory\Enums\TestType;
use App\Utils\Constants;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Arr;
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

        $acceptanceItems=$this->getAcceptanceItems($invoice);
        foreach ($acceptanceItems as $acceptanceItem) {
            $total = $acceptanceItem["price"] - $acceptanceItem["discount"];
            $discount=$acceptanceItem["discount"]??"0";
            $price=$acceptanceItem["price"]??"0";
            $patient=(object)$acceptanceItem["patient"]??[];
            $rows[] = [
                Carbon::parse($invoice->created_at)->toDate(),
                $invoice->invoiceNo,
                (string)optional($patient)->fullName,
                (string)optional($invoice->owner)->fullName,
                $acceptanceItem["test"]["name"],
                $acceptanceItem["method"]["name"]??"",
                "$price",
                "$discount",
                "$total",
                "0",
                "0",
                "$total",
                "$total",
                $invoice->status,
                optional($patient)->nationality ? Constants::countries(optional($patient)->nationality) : "",
                ucfirst((string)optional($patient)->gender),
                optional($patient)->age,
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
    private function getAcceptanceItems($invoice){

        return Arr::flatten(
            array_values(
                $invoice->acceptanceItems
                    ->groupBy("test.type")
                    ->map(function ($item,$key) {
                        if ($key!==TestType::PANEL->value)
                            return $item;
                        else
                            return array_values($item
                                ->groupBy("panel_id")
                                ->map(function ($item,$key) {
                                    return collect([
                                        "id"=>$key,
                                        "price"=>$item->sum("price"),
                                        "discount"=>$item->sum("discount"),
                                        "test"=>$item->first()->test,
                                        "patient"=>$item->first()->patient,
                                        "items"=>$item
                                    ]);
                                })->toArray());
                    })
                    ->toArray()
            )
            ,1);

    }
}
