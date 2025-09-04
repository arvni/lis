<?php

namespace App\Domains\Reception\Exports;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class AcceptanceItemsExport implements
    FromCollection,
    WithMapping,
    WithHeadings,
    ShouldAutoSize,
    WithStyles
{
    private const TIMEZONE = 'Asia/Muscat';
    private const HEADER_COLOR = '0361ac';
    private const HEADER_TEXT_COLOR = 'ffffff';

    private Collection $acceptanceItems;

    public function __construct(Collection $acceptanceItems)
    {
        $this->acceptanceItems = $acceptanceItems;
    }

    /**
     * Returns the collection of acceptance items for export
     */
    public function collection(): Collection
    {
        return $this->acceptanceItems;
    }

    /**
     * Defines the column headers for the export
     */
    public function headings(): array
    {
        return [
            'ID',
            'Client',
            'Patient Name',
            'Patient ID',
            'Date of Birth',
            'Test',
            'Method',
            'Price',
            'Discount',
            'Sampled At',
            'Barcodes',
            'Status',
            'Created At',
            'Last Updated',
        ];
    }

    /**
     * Maps each row of data to the appropriate format
     */
    public function map($row): array
    {
        return [
            $row->id,
            $this->getClientName($row),
            $row->patient_fullname,
            $row->patient_idno,
            $row->patient_dateofbirth,
            $row->test_testsname,
            $row->method_name,
            $this->formatPrice($row->price),
            $this->formatDiscount($row->discount),
            $this->formatDate($row->activeSamples->max("collection_date")),
            $row->activeSamples->unique("barcode")->pluck("barcode")->join(", "),
            $this->formatStatus($row->status),
            $this->formatDateTime($row->created_at),
            $this->formatDateTime($row->updated_at),
        ];
    }

    /**
     * Applies styling to the worksheet
     */
    public function styles(Worksheet $sheet): array
    {
        $sheet->setAutoFilter('A1:M1');

        return [
            1 => [
                'font' => [
                    'bold' => true,
                    'color' => [
                        'rgb' => self::HEADER_TEXT_COLOR,
                    ],
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'color' => [
                        'rgb' => self::HEADER_COLOR,
                    ],
                ],
            ],
        ];
    }

    /**
     * Safely retrieves the client name from the row
     */
    private function getClientName($row): ?string
    {
        return optional(optional($row->invoice)->owner)->fullName;
    }

    /**
     * Formats price with proper decimal places
     */
    private function formatPrice($price): string
    {
        return number_format((float) $price, 2);
    }

    /**
     * Formats discount with proper decimal places
     */
    private function formatDiscount($discount): string
    {
        return number_format((float) $discount, 2);
    }

    /**
     * Formats date to consistent format
     */
    private function formatDate($date): string
    {
        if (!$date) {
            return '';
        }

        return Carbon::parse($date, self::TIMEZONE)->format('Y-m-d');
    }

    /**
     * Formats datetime to consistent format
     */
    private function formatDateTime($datetime): string
    {
        if (!$datetime) {
            return '';
        }

        return Carbon::parse($datetime, self::TIMEZONE)->format('Y-m-d H:i');
    }

    /**
     * Formats status for better readability
     */
    private function formatStatus($status): string
    {
        return ucfirst(strtolower($status));
    }
}
