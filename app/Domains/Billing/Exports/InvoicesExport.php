<?php

namespace App\Domains\Billing\Exports;

use App\Domains\Billing\Models\InvoiceItem;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Utils\Constants;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class InvoicesExport implements FromCollection, ShouldAutoSize, WithHeadings, WithMapping, WithStyles
{
    protected Collection $invoices;

    protected array $dynamicColumns = [];

    public function __construct(Collection $invoices)
    {
        $this->invoices = $invoices;
        $this->extractDynamicColumns();
    }

    /**
     * Extract all unique custom parameter keys from invoice items.
     */
    private function extractDynamicColumns(): void
    {
        $customKeys = [];

        foreach ($this->invoices as $invoice) {
            foreach ($invoice->invoiceItems as $item) {
                $priceParams = $item->customParameters['price'] ?? null;
                if (is_array($priceParams)) {
                    foreach (array_keys($priceParams) as $key) {
                        $customKeys[$key] = true;
                    }
                }
            }
        }

        $this->dynamicColumns = array_keys($customKeys);
        sort($this->dynamicColumns); // Sort alphabetically for consistency
    }

    public function collection()
    {
        return $this->invoices;
    }

    public function styles(Worksheet $sheet): array
    {
        // Calculate the last column dynamically
        $totalColumns = 19 + count($this->dynamicColumns); // 19 base columns + dynamic columns
        $lastColumn = Coordinate::stringFromColumnIndex($totalColumns);
        $sheet->setAutoFilter("A1:{$lastColumn}1");

        return [
            1 => [
                'font' => [
                    'bold' => true,
                    'color' => [
                        'rgb' => 'ffffff',
                    ],
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'color' => [
                        'rgb' => '0361ac',
                    ],
                ],
            ],
        ];

    }

    public function map($invoice): array
    {
        $rows = [];

        foreach ($invoice->invoiceItems as $item) {
            // Line data comes from the invoice item; only patient information is
            // resolved from the acceptance item(s) linked to this invoice item.
            $patient = $this->patientFor($item);

            $price = (float) $item->price;
            $discount = (float) $item->discount;
            $total = $price - $discount;

            // Base row data
            $row = [
                Carbon::parse($invoice->created_at)->toDate(),
                $invoice->invoiceNo,
                $invoice->statement?->no ?? '',
                (string) optional($patient)->fullName,
                (string) optional($invoice->owner)->fullName,
                $item->title,
                (string) optional($this->methodFor($item))->name,
                "$price",
                "$discount",
                "$total",
                '0',
                '0',
                "$total",
                "$total",
                $invoice->status,
                optional($patient)->nationality ? Constants::countries(optional($patient)->nationality) : '',
                ucfirst((string) optional($patient)->gender),
                optional($patient)->age,
                ucfirst((string) optional(optional($invoice->payments)[0])->paymentMethod?->value),
            ];

            // Add dynamic columns from the invoice item's customParameters
            foreach ($this->dynamicColumns as $columnKey) {
                $row[] = $this->getCustomParameterValue($item, $columnKey);
            }

            $rows[] = $row;
        }

        return $rows;
    }

    /**
     * Resolve the patient for an invoice item via its linked acceptance item(s).
     * Manual fees / adjustments have no acceptance item, so this may be null.
     */
    private function patientFor(InvoiceItem $item): ?\App\Domains\Reception\Models\Patient
    {
        return $this->firstAcceptanceItem($item)?->patient;
    }

    /**
     * Resolve the test method for an invoice item via its linked acceptance item(s).
     */
    private function methodFor(InvoiceItem $item): ?\App\Domains\Laboratory\Models\Method
    {
        return $this->firstAcceptanceItem($item)?->method;
    }

    private function firstAcceptanceItem(InvoiceItem $item): ?AcceptanceItem
    {
        return $item->acceptanceItems->first();
    }

    /**
     * Get a custom parameter value from the invoice item.
     * Returns "0" if not found.
     */
    private function getCustomParameterValue(InvoiceItem $item, string $key)
    {
        $priceParams = $item->customParameters['price'] ?? null;

        if (is_array($priceParams) && isset($priceParams[$key])) {
            return $priceParams[$key];
        }

        return '0';
    }

    public function headings(): array
    {
        $baseHeadings = [
            'Date',
            'Invoice No.',
            'Statement',
            'Patient Name',
            'Client',
            'Test',
            'Method',
            'Rate(incl. vat)',
            'Discount',
            'Taxable',
            'VAT Amount',
            'VAT %',
            'Net Amount',
            'Patient Amount',
            'Status',
            'Nationality',
            'Gender',
            'Age',
            'Payment Method',
        ];

        // Add dynamic column headings
        foreach ($this->dynamicColumns as $columnKey) {
            // Convert camelCase to Title Case with spaces
            $heading = $this->formatColumnHeading($columnKey);
            $baseHeadings[] = $heading;
        }

        return $baseHeadings;
    }

    /**
     * Format column key to readable heading
     * Example: "noEmbryos" -> "No. Embryos"
     */
    private function formatColumnHeading(string $key): string
    {
        // Convert camelCase to words
        $heading = preg_replace('/([a-z])([A-Z])/', '$1 $2', $key);

        // Capitalize first letter of each word
        $heading = ucwords($heading);

        // Special formatting for "no" prefix (number)
        $heading = preg_replace('/^No\b/', 'No.', $heading);

        return $heading;
    }
}
