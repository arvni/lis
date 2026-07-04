<?php

namespace App\Domains\Reception\Exports;

use App\Domains\Reception\Adapters\BillingAdapter;
use App\Domains\Reception\DTOs\AcceptanceItemExportRow;
use App\Domains\Reception\Models\AcceptanceItem;
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

    /** @var Collection<int, AcceptanceItem> */
    private Collection $acceptanceItems;
    private BillingAdapter $billingAdapter;

    /**
     * @param  Collection<int, AcceptanceItem>  $acceptanceItems
     */
    public function __construct(Collection $acceptanceItems)
    {
        $this->acceptanceItems = $acceptanceItems;
        $this->billingAdapter = app(BillingAdapter::class);
    }

    /**
     * Returns the collection of acceptance items for export
     * Merges items with same panel_id and acceptance_id
     *
     * @return SupportCollection<int, AcceptanceItemExportRow>
     */
    public function collection(): SupportCollection
    {
        return $this->mergeAcceptanceItems($this->acceptanceItems);
    }

    /**
     * Merge acceptance items that have the same panel_id and acceptance_id into
     * typed export rows.
     *
     * @param  Collection<int, AcceptanceItem>  $items
     * @return SupportCollection<int, AcceptanceItemExportRow>
     */
    private function mergeAcceptanceItems(Collection $items): SupportCollection
    {
        /** @var SupportCollection<int, AcceptanceItemExportRow> $merged */
        $merged = new SupportCollection();

        // Group by acceptance_id and panel_id
        $grouped = $items->groupBy(function (AcceptanceItem $item) {
            // Items without panel_id will be grouped individually by their own id
            if (!$item->panel_id) {
                return "no_panel_{$item->id}";
            }
            return "acceptance_{$item->acceptance_id}_panel_{$item->panel_id}";
        });

        foreach ($grouped as $group) {
            if ($group->count() === 1) {
                // Single item, no merging needed
                /** @var AcceptanceItem $single */
                $single = $group->first();
                $merged->push(AcceptanceItemExportRow::fromAcceptanceItem($single));
            } else {
                // Multiple items with same panel_id and acceptance_id - merge them
                $merged->push(AcceptanceItemExportRow::fromMergedGroup($group));
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
            'Tags',
            'Price',
            'Discount',
            'Sampled At',
            'Barcodes',
            'Status',
            'Invoice No',
            'Invoice Date',
            'Created At',
            'Last Updated',
            'Est. Report Date',
        ];
    }

    /**
     * Maps each row of data to the appropriate format
     *
     * @param  AcceptanceItemExportRow  $row
     * @return array<int, string|int|null>
     */
    public function map($row): array
    {
        return [
            $row->id,
            $this->getClientName($row),
            $row->patientFullname,
            $row->patientIdno,
            $row->patientDateofbirth,
            $row->testTestsname,
            $row->methodName,
            $this->formatTags($row),
            $this->formatPrice($row->price),
            $this->formatDiscount($row->discount),
            $this->formatDate($row->activeSamples->max("collection_date")),
            $row->activeSamples->unique("barcode")->pluck("barcode")->join(", "),
            $this->formatStatus($row->status),
            $this->getInvoiceNo($row),
            $this->getInvoiceDate($row),
            $this->formatDateTime($row->createdAt),
            $this->formatDateTime($row->updatedAt),
            $this->formatEstimatedReportDate($row),
        ];
    }

    /**
     * Applies styling to the worksheet
     */
    public function styles(Worksheet $sheet): array
    {
        $sheet->setAutoFilter('A1:R1');

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
    private function getClientName(AcceptanceItemExportRow $row): ?string
    {
        $acceptance = $row->acceptance ?? null;
        if ($acceptance && $acceptance->referrer) {
            return $acceptance->referrer->fullName;
        }
        return optional($acceptance)->patient->fullName ?? null;
    }

    /**
     * Formats price with proper decimal places
     */
    private function formatPrice(mixed $price): string
    {
        return number_format((float) $price, 2);
    }

    /**
     * Formats discount with proper decimal places
     */
    private function formatDiscount(mixed $discount): string
    {
        return number_format((float) $discount, 2);
    }

    /**
     * Formats assigned tags as a comma-separated list.
     */
    private function formatTags(AcceptanceItemExportRow $row): string
    {
        return collect($row->tags)->pluck('name')->filter()->join(', ');
    }

    /**
     * Formats date to consistent format
     */
    private function formatDate(mixed $date): string
    {
        if (!$date) {
            return '';
        }

        return Carbon::parse($date, self::TIMEZONE)->format('Y-m-d');
    }

    /**
     * Formats datetime to consistent format
     */
    private function formatDateTime(mixed $datetime): string
    {
        if (!$datetime) {
            return '';
        }

        return Carbon::parse($datetime, self::TIMEZONE)->format('Y-m-d H:i');
    }

    /**
     * Formats status for better readability
     */
    private function formatStatus(string $status): string
    {
        return ucfirst(strtolower($status));
    }

    /**
     * Gets the invoice number for the acceptance item
     */
    private function getInvoiceNo(AcceptanceItemExportRow $row): string
    {
        $invoice = $this->getInvoice($row);

        if (!$invoice) {
            return '';
        }

        return $this->billingAdapter->getInvoiceNo($invoice);
    }

    /**
     * Gets the invoice date for the acceptance item
     */
    private function getInvoiceDate(AcceptanceItemExportRow $row): string
    {
        $invoice = $this->getInvoice($row);

        if (!$invoice) {
            return '';
        }

        return $this->formatDate($invoice->created_at);
    }

    /**
     * Computes the estimated report date by adding turnaround_time working days
     * (skipping Friday and Saturday) to the acceptance item's created_at date.
     */
    private function formatEstimatedReportDate(AcceptanceItemExportRow $row): string
    {
        $turnaroundTime = $row->methodTurnaroundTime ?? null;
        if (!$turnaroundTime || !$row->createdAt) {
            return '';
        }

        $date = Carbon::parse($row->createdAt, self::TIMEZONE);
        $remaining = (int) $turnaroundTime;

        while ($remaining > 0) {
            $date->addDay();
            if ($date->dayOfWeek !== Carbon::FRIDAY && $date->dayOfWeek !== Carbon::SATURDAY) {
                $remaining--;
            }
        }

        return $date->format('Y-m-d');
    }

    /**
     * Safely retrieves the invoice (a Billing model, kept loosely typed so the
     * Reception layer does not import it) from the row.
     */
    private function getInvoice(AcceptanceItemExportRow $row): mixed
    {
        return $row->invoice;
    }
}
