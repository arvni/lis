<?php

namespace App\Domains\Reception\Exports;

use App\Domains\Billing\Repositories\InvoiceRepository;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;
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
    private InvoiceRepository $invoiceRepository;

    public function __construct(Collection $acceptanceItems)
    {
        $this->acceptanceItems = $acceptanceItems;
        $this->invoiceRepository = app(InvoiceRepository::class);
    }

    /**
     * Returns the collection of acceptance items for export
     * Merges items with same panel_id and acceptance_id
     */
    public function collection(): SupportCollection
    {
        return $this->mergeAcceptanceItems($this->acceptanceItems);
    }

    /**
     * Merge acceptance items that have the same panel_id and acceptance_id
     */
    private function mergeAcceptanceItems(Collection $items): SupportCollection
    {
        $merged = new SupportCollection();

        // Group by acceptance_id and panel_id
        $grouped = $items->groupBy(function ($item) {
            // Items without panel_id will be grouped individually by their own id
            if (!$item->panel_id) {
                return "no_panel_{$item->id}";
            }
            return "acceptance_{$item->acceptance_id}_panel_{$item->panel_id}";
        });

        foreach ($grouped as $key => $group) {
            if ($group->count() === 1) {
                // Single item, no merging needed
                $merged->push($group->first());
            } else {
                // Multiple items with same panel_id and acceptance_id - merge them
                $first = $group->first();

                // Create a merged item object
                $mergedItem = (object) [
                    'id' => $first->id,
                    'acceptance_id' => $first->acceptance_id,
                    'panel_id' => $first->panel_id,
                    'price' => $group->sum('price'),
                    'discount' => $group->sum('discount'),
                    'patient_fullname' => $first->patient_fullname,
                    'patient_idno' => $first->patient_idno,
                    'patient_dateofbirth' => $first->patient_dateofbirth,
                    'test_testsname' => $first->test_testsname,
                    'method_name' => $first->method_name,
                    'activeSamples' => $first->activeSamples,
                    'status' => $first->status,
                    'created_at' => $first->created_at,
                    'updated_at' => $first->updated_at,
                    'invoice' => $first->invoice,
                    'is_merged' => true,
                ];

                $merged->push($mergedItem);
            }
        }

        return $merged;
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
            'Invoice No',
            'Invoice Date',
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
            $this->getInvoiceNo($row),
            $this->getInvoiceDate($row),
            $this->formatDateTime($row->created_at),
            $this->formatDateTime($row->updated_at),
        ];
    }

    /**
     * Applies styling to the worksheet
     */
    public function styles(Worksheet $sheet): array
    {
        $sheet->setAutoFilter('A1:P1');

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

    /**
     * Gets the invoice number for the acceptance item
     */
    private function getInvoiceNo($row): string
    {
        $invoice = $this->getInvoice($row);

        if (!$invoice) {
            return '';
        }

        return $this->invoiceRepository->getInvoiceNo($invoice);
    }

    /**
     * Gets the invoice date for the acceptance item
     */
    private function getInvoiceDate($row): string
    {
        $invoice = $this->getInvoice($row);

        if (!$invoice) {
            return '';
        }

        return $this->formatDate($invoice->created_at);
    }

    /**
     * Safely retrieves the invoice from the row
     */
    private function getInvoice($row)
    {
        // Handle both model instances and merged objects
        if (is_object($row) && isset($row->invoice)) {
            return $row->invoice;
        }

        return null;
    }
}
