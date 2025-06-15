<?php

namespace App\Domains\Reception\Exports;


use Illuminate\Database\Eloquent\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class AcceptanceItemsExport implements FromCollection
    , WithMapping
    , WithHeadings
    , ShouldAutoSize
    , WithStyles
{
    protected Collection $acceptanceItems;

    public function __construct(Collection $acceptanceItems)
    {
        $this->acceptanceItems = $acceptanceItems;
    }

    /**
     * @return Collection
     */
    public function collection()
    {
        return $this->acceptanceItems;
    }

    public function headings(): array
    {
        return [
            "ID",
            "Client",
            "Name",
            "ID No",
            "Date Of Birth",
            "Test",
            "Method",
            "Price",
            "Discount",
            "Sampled At",
            "Status",
            "Created At",
            "Last Update",
        ];
    }

    public function map($row): array
    {
        return [
            $row->id,
            optional(optional($row->invoice)->owner)->fullName,
            $row->patient_fullname,
            $row->patient_idno,
            $row->patient_dateofbirth,
            $row->test_testsname,
            $row->method_name,
            $row->price,
            $row->discount,
            $row->active_sample_created_at,
            $row->status,
            $row->created_at,
            $row->updated_at,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->setAutoFilter('A1:M1');
        return [
            1 => [
                'font' => [
                    'bold' => true,
                    'color'=>[
                        "rgb"=>"ffffff"
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
}
