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
    protected array $dynamicColumns = [];

    public function __construct(Collection $invoices)
    {
        $this->invoices = $invoices;
        $this->extractDynamicColumns();
    }

    /**
     * Extract all unique custom parameter keys from acceptance items
     */
    private function extractDynamicColumns(): void
    {
        $customKeys = [];

        foreach ($this->invoices as $invoice) {
            foreach ($invoice->acceptanceItems as $item) {
                if ($item->customParameters && isset($item->customParameters['price'])) {
                    $priceParams = $item->customParameters['price'];
                    if (is_array($priceParams)) {
                        foreach (array_keys($priceParams) as $key) {
                            $customKeys[$key] = true;
                        }
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

    public function styles(Worksheet $sheet)
    {
        // Calculate the last column dynamically
        $totalColumns = 18 + count($this->dynamicColumns); // 18 base columns + dynamic columns
        $lastColumn = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($totalColumns);
        $sheet->setAutoFilter("A1:{$lastColumn}1");

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

            // Base row data
            $row = [
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

            // Add dynamic columns from customParameters
            foreach ($this->dynamicColumns as $columnKey) {
                $value = $this->getCustomParameterValue($acceptanceItem, $columnKey);
                $row[] = $value;
            }

            $rows[] = $row;
        }
        return $rows;
    }

    /**
     * Get custom parameter value from acceptance item
     * Returns 0 if not found
     */
    private function getCustomParameterValue($acceptanceItem, string $key)
    {
        // Handle collection items (from panels)
        if ($acceptanceItem instanceof \Illuminate\Support\Collection) {
            if (isset($acceptanceItem["items"])) {
                // For panel items, sum up the values from all items
                $sum = 0;
                foreach ($acceptanceItem["items"] as $item) {
                    $itemValue = $this->extractValueFromItem($item, $key);
                    if (is_numeric($itemValue)) {
                        $sum += (float)$itemValue;
                    }
                }
                return $sum > 0 ? $sum : "0";
            }
        }

        // Handle regular acceptance items
        return $this->extractValueFromItem($acceptanceItem, $key);
    }

    /**
     * Extract value from a single acceptance item
     */
    private function extractValueFromItem($item, string $key)
    {
        if (is_array($item)) {
            $customParams = $item['customParameters'] ?? null;
        } else {
            $customParams = $item->customParameters ?? null;
        }

        if ($customParams && isset($customParams['price'][$key])) {
            return $customParams['price'][$key];
        }

        return "0";
    }

    public function headings(): array
    {
        $baseHeadings = [
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
