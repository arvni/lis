<?php

namespace App\Domains\Billing\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class MonthlyStatementExport implements
    FromCollection,
    WithHeadings,
    WithStyles,
    WithColumnFormatting,
    WithEvents,
    ShouldAutoSize
{
    protected Collection $data;
    protected array $options;
    protected array $headers;

    // Configuration constants - FIXED for proper Laravel Excel flow
    private const HEADER_ROW = 8;      // Headers will be at row 8
    private const DATA_START_ROW = 9;  // Data starts at row 9
    private const CURRENCY = 'OMR';

    // Column indices for easier maintenance
    private const COL_INVOICE_NO = 0;
    private const COL_ACCEPTANCE_DATE = 1;
    private const COL_PATIENT_NAME = 2;
    private const COL_TEST_CODES = 3;
    private const COL_TEST_NAMES = 4;
    private const COL_GROSS_AMOUNT = 5;
    private const COL_DISCOUNTS = 6;
    private const COL_NET_AMOUNT = 7;
    private const COL_CURRENCY = 8;
    private const COL_REPORTED_DATE = 9;

    public function __construct(Collection $data, array $options = [])
    {
        $this->data = $data;
        $this->options = array_merge($this->getDefaultOptions(), $options);
        $this->headers = $this->getHeaders();
    }

    /**
     * Get default options with better defaults
     */
    private function getDefaultOptions(): array
    {
        return [
            'customer_name' => 'N/A',
            'statement_number' => $this->generateStatementNumber(),
            'statement_date' => now()->format('M d, Y'),
            'total_samples' => 0,
            'total_amount' => 0,
            'generated_at' => now()->format('M d, Y H:i'),
            'company_name' => "Muscat Medical Center",
            'company_address' => config('company.address', 'Muscat, Sultanate of Oman'),
            'company_phone' => config('company.phone', '+968 2207 3671'),
            'currency' => self::CURRENCY,
        ];
    }

    /**
     * Get column headers with improved readability
     */
    private function getHeaders(): array
    {
        return [
            'Invoice No.',
            'Registration Date',
            'Patient Name',
            'Test Codes',
            'Test Names',
            'Gross Amount (' . $this->options['currency'] . ')',
            'Discounts (' . $this->options['currency'] . ')',
            'Net Amount (' . $this->options['currency'] . ')',
            'Currency',
            'Report Date'
        ];
    }

    /**
     * Generate statement number based on current date and time
     */
    private function generateStatementNumber(): string
    {
        $now = now();
        return 'STMT-' . $now->format('Ym') . '-' . str_pad($now->format('His'), 6, '0', STR_PAD_LEFT);
    }

    /**
     * Return collection of data - Laravel Excel will place this after headings
     */
    public function collection(): Collection
    {
        // Return the data as-is - Laravel Excel will handle placement
        return $this->data;
    }

    /**
     * Define headings - Laravel Excel places these automatically
     */
    public function headings(): array
    {
        // Return empty array since we'll manually place headers in AfterSheet
        return [];
    }

    /**
     * Define column formatting with better number formats
     */
    public function columnFormats(): array
    {
        $dateFormat = NumberFormat::FORMAT_DATE_DMYSLASH;
        $currencyFormat = '#,##0.000';  // 3 decimal places for OMR

        return [
            $this->getColumnLetter(self::COL_ACCEPTANCE_DATE) => $dateFormat,
            $this->getColumnLetter(self::COL_GROSS_AMOUNT) => $currencyFormat,
            $this->getColumnLetter(self::COL_DISCOUNTS) => $currencyFormat,
            $this->getColumnLetter(self::COL_NET_AMOUNT) => $currencyFormat,
            $this->getColumnLetter(self::COL_REPORTED_DATE) => $dateFormat,
        ];
    }

    /**
     * Get column letter from index
     */
    private function getColumnLetter(int $index): string
    {
        return chr(65 + $index);
    }

    /**
     * Define styles for the worksheet with improved colors and typography
     */
    public function styles(Worksheet $sheet): array
    {
        return [
            // Main title style - more professional
            1 => [
                'font' => ['bold' => true, 'size' => 18, 'color' => ['rgb' => '2E5090']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER]
            ],

            // Company info style - better readability
            '2:3' => [
                'font' => ['size' => 10, 'color' => ['rgb' => '555555']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]
            ],

            // Statement info labels - consistent styling
            '5:7' => [
                'font' => ['size' => 10, 'bold' => true, 'color' => ['rgb' => '333333']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT]
            ],

            // Table headers - improved contrast
            self::HEADER_ROW => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 10],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '2E5090']
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical' => Alignment::VERTICAL_CENTER
                ],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => '000000']
                    ]
                ]
            ]
        ];
    }

    /**
     * Define events for complex formatting
     */
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $this->formatSheet($sheet);
            },
        ];
    }

    /**
     * Main sheet formatting method
     */
    private function formatSheet(Worksheet $sheet): void
    {
        // First, move the data that Laravel Excel placed automatically
        $this->repositionDataAndHeaders($sheet);

        // Then apply all formatting
        $highestRow = $sheet->getHighestRow();
        $lastColumn = $this->getColumnLetter(count($this->headers) - 1);

        $this->setupHeader($sheet);
        $this->formatDataTable($sheet, $highestRow, $lastColumn);
        $this->addSummarySection($sheet, $highestRow);
        $this->applyDataBorders($sheet, $highestRow, $lastColumn);
        $this->adjustColumnWidths($sheet);
        $this->addFooter($sheet, $highestRow);
    }

    /**
     * Reposition data and headers to correct locations
     */
    private function repositionDataAndHeaders(Worksheet $sheet): void
    {
        // Laravel Excel places data starting from row 1
        // We need to move it to the correct position

        $originalData = [];
        $highestRow = $sheet->getHighestRow();
        $highestCol = $sheet->getHighestDataColumn();

        // Read the original data placed by Laravel Excel
        for ($row = 1; $row <= $highestRow; $row++) {
            $rowData = [];
            for ($col = 'A'; $col <= $highestCol; $col++) {
                $cellValue = $sheet->getCell($col . $row)->getValue();
                if ($cellValue !== null) {
                    $rowData[$col] = $cellValue;
                }
            }
            if (!empty($rowData)) {
                $originalData[$row] = $rowData;
            }
        }

        // Clear the worksheet
        $sheet->removeRow(1, $highestRow);

        // Place headers at correct position
        foreach ($this->headers as $index => $header) {
            $column = $this->getColumnLetter($index);
            $sheet->setCellValue($column . self::HEADER_ROW, $header);
        }

        // Place data at correct position
        $dataRow = self::DATA_START_ROW;
        foreach ($originalData as $rowData) {
            $col = 0;
            $values = array_values($rowData); // Get just the values

            // Ensure we have exactly the right number of columns
            while (count($values) < count($this->headers)) {
                $values[] = ''; // Add empty values if missing
            }

            // Place each value in the correct column
            foreach ($values as $index => $cellValue) {
                if ($index < count($this->headers)) {
                    $column = $this->getColumnLetter($index);
                    $sheet->setCellValue($column . $dataRow, $cellValue);
                }
            }
            $dataRow++;
        }
    }

    /**
     * Setup the header section with improved layout
     */
    private function setupHeader(Worksheet $sheet): void
    {
        $lastCol = $this->getColumnLetter(count($this->headers) - 1);

        // Main title with better spacing
        $sheet->setCellValue('A1', 'MONTHLY BILLING STATEMENT');
        $sheet->mergeCells("A1:{$lastCol}1");
        $sheet->getRowDimension(1)->setRowHeight(25);

        // Company information
        if (!empty($this->options['company_name'])) {
            $sheet->setCellValue('A2', $this->options['company_name']);
            $sheet->mergeCells("A2:{$lastCol}2");

            if (!empty($this->options['company_address']) || !empty($this->options['company_phone'])) {
                $companyDetails = [];
                if (!empty($this->options['company_address'])) {
                    $companyDetails[] = $this->options['company_address'];
                }
                if (!empty($this->options['company_phone'])) {
                    $companyDetails[] = 'Tel: ' . $this->options['company_phone'];
                }
                $sheet->setCellValue('A3', implode(' | ', $companyDetails));
                $sheet->mergeCells("A3:{$lastCol}3");
            }
        }

        // Add separator line
        $sheet->getRowDimension(4)->setRowHeight(5);

        // Statement information section
        $sheet->setCellValue('A5', 'Customer Name:');
        $sheet->setCellValue('B5', $this->options['customer_name'] ?: 'Not Specified');
        $sheet->getStyle('B5')->getFont()->setBold(true);

        $sheet->setCellValue('A6', 'Statement Number:');
        $sheet->setCellValue('B6', $this->options['statement_number']);
        $sheet->getStyle('B6')->getFont()->setBold(true);

        // Right side information
        $rightCol = $this->getColumnLetter(count($this->headers) - 2);
        $valueCol = $this->getColumnLetter(count($this->headers) - 1);

        $sheet->setCellValue($rightCol . '5', 'Statement Date:');
        $sheet->setCellValue($valueCol . '5', $this->options['statement_date']);
        $sheet->getStyle($valueCol . '5')->getFont()->setBold(true);

        $sheet->setCellValue($rightCol . '6', 'Total Samples:');
        $sheet->setCellValue($valueCol . '6', number_format($this->options['total_samples']));
        $sheet->getStyle($valueCol . '6')->getFont()->setBold(true);

        // Add space before table
        $sheet->getRowDimension(7)->setRowHeight(10);

        // Headers are already placed in repositionDataAndHeaders()
        $sheet->getRowDimension(self::HEADER_ROW)->setRowHeight(20);
    }

    /**
     * Format the data table section with improved styling
     */
    private function formatDataTable(Worksheet $sheet, int $highestRow, string $lastColumn): void
    {
        $dataStartRow = self::DATA_START_ROW;
        $lastDataRow = $highestRow;

        // Apply alternating row colors
        for ($row = $dataStartRow; $row <= $lastDataRow; $row++) {
            $fillColor = ($row % 2 === 0) ? 'F8F9FA' : 'FFFFFF';

            $sheet->getStyle("A{$row}:{$lastColumn}{$row}")
                ->getFill()
                ->setFillType(Fill::FILL_SOLID)
                ->getStartColor()
                ->setRGB($fillColor);

            $sheet->getRowDimension($row)->setRowHeight(18);
        }

        // Center align specific columns
        $centerAlignCols = [
            self::COL_INVOICE_NO,
            self::COL_CURRENCY,
            self::COL_ACCEPTANCE_DATE,
            self::COL_REPORTED_DATE
        ];

        foreach ($centerAlignCols as $colIndex) {
            $column = $this->getColumnLetter($colIndex);
            $sheet->getStyle("{$column}{$dataStartRow}:{$column}{$lastDataRow}")
                ->getAlignment()
                ->setHorizontal(Alignment::HORIZONTAL_CENTER)
                ->setVertical(Alignment::VERTICAL_CENTER);
        }

        // Right align amount columns
        $amountCols = [
            self::COL_GROSS_AMOUNT,
            self::COL_DISCOUNTS,
            self::COL_NET_AMOUNT
        ];

        foreach ($amountCols as $colIndex) {
            $column = $this->getColumnLetter($colIndex);
            $sheet->getStyle("{$column}{$dataStartRow}:{$column}{$lastDataRow}")
                ->getAlignment()
                ->setHorizontal(Alignment::HORIZONTAL_RIGHT)
                ->setVertical(Alignment::VERTICAL_CENTER);
        }

        // Left align text columns
        $leftAlignCols = [self::COL_PATIENT_NAME, self::COL_TEST_CODES, self::COL_TEST_NAMES];
        foreach ($leftAlignCols as $colIndex) {
            $column = $this->getColumnLetter($colIndex);
            $sheet->getStyle("{$column}{$dataStartRow}:{$column}{$lastDataRow}")
                ->getAlignment()
                ->setHorizontal(Alignment::HORIZONTAL_LEFT)
                ->setVertical(Alignment::VERTICAL_CENTER);
        }
    }

    /**
     * Add enhanced summary section at the bottom
     */
    private function addSummarySection(Worksheet $sheet, int $highestRow): void
    {
        $summaryStartRow = $highestRow + 3;

        // Calculate totals
        $totals = $this->calculateTotals();

        // Summary positioning
        $labelCol = $this->getColumnLetter(count($this->headers) - 3);
        $valueCol = $this->getColumnLetter(count($this->headers) - 2);
        $currencyCol = $this->getColumnLetter(count($this->headers) - 1);

        // Summary header
        $sheet->setCellValue($labelCol . $summaryStartRow, 'BILLING SUMMARY');
        $sheet->mergeCells($labelCol . $summaryStartRow . ':' . $currencyCol . $summaryStartRow);
        $sheet->getStyle($labelCol . $summaryStartRow)
            ->getFont()->setBold(true)->setSize(12);
        $sheet->getStyle($labelCol . $summaryStartRow)
            ->getFont()->getColor()->setRGB('2E5090');
        $sheet->getStyle($labelCol . $summaryStartRow)
            ->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('E8F0FE');

        // Summary items
        $summaryItems = [
            'Total Gross Amount:' => $totals['gross_amount'],
            'Total Discounts:' => $totals['discounts'],
            'Total Net Amount:' => $totals['net_amount']
        ];

        $currentRow = $summaryStartRow + 1;
        foreach ($summaryItems as $label => $value) {
            $sheet->setCellValue($labelCol . $currentRow, $label);
            $sheet->setCellValue($valueCol . $currentRow, $value);
            $sheet->setCellValue($currencyCol . $currentRow, $this->options['currency']);

            $sheet->getStyle($labelCol . $currentRow)->getFont()->setBold(true);
            $sheet->getStyle($valueCol . $currentRow)->getNumberFormat()->setFormatCode('#,##0.000');
            $sheet->getStyle($valueCol . $currentRow)->getFont()->setBold(true);

            $currentRow++;
        }

        // Border around summary
        $sheet->getStyle($labelCol . $summaryStartRow . ':' . $currencyCol . ($currentRow - 1))
            ->getBorders()
            ->getOutline()
            ->setBorderStyle(Border::BORDER_MEDIUM);
        $sheet->getStyle($labelCol . $summaryStartRow . ':' . $currencyCol . ($currentRow - 1))
            ->getBorders()
            ->getOutline()
            ->getColor()
            ->setRGB('2E5090');
    }

    /**
     * Calculate totals from data
     */
    private function calculateTotals(): array
    {
        return [
            'gross_amount' => $this->data->sum(function($row) { return (float)($row[self::COL_GROSS_AMOUNT] ?? 0); }),
            'discounts' => $this->data->sum(function($row) { return (float)($row[self::COL_DISCOUNTS] ?? 0); }),
            'net_amount' => $this->data->sum(function($row) { return (float)($row[self::COL_NET_AMOUNT] ?? 0); })
        ];
    }

    /**
     * Apply borders to the data area
     */
    private function applyDataBorders(Worksheet $sheet, int $highestRow, string $lastColumn): void
    {
        $dataRange = "A" . self::HEADER_ROW . ":{$lastColumn}{$highestRow}";

        // Light borders for data area
        $sheet->getStyle($dataRange)
            ->getBorders()
            ->getAllBorders()
            ->setBorderStyle(Border::BORDER_THIN);
        $sheet->getStyle($dataRange)
            ->getBorders()
            ->getAllBorders()
            ->getColor()
            ->setRGB('DDDDDD');

        // Header border
        $sheet->getStyle("A" . self::HEADER_ROW . ":{$lastColumn}" . self::HEADER_ROW)
            ->getBorders()
            ->getAllBorders()
            ->setBorderStyle(Border::BORDER_MEDIUM);
        $sheet->getStyle("A" . self::HEADER_ROW . ":{$lastColumn}" . self::HEADER_ROW)
            ->getBorders()
            ->getAllBorders()
            ->getColor()
            ->setRGB('2E5090');

        // Outer border
        $sheet->getStyle($dataRange)
            ->getBorders()
            ->getOutline()
            ->setBorderStyle(Border::BORDER_MEDIUM);
        $sheet->getStyle($dataRange)
            ->getBorders()
            ->getOutline()
            ->getColor()
            ->setRGB('2E5090');
    }

    /**
     * Adjust column widths for optimal readability
     */
    private function adjustColumnWidths(Worksheet $sheet): void
    {
        $columnWidths = [
            self::COL_INVOICE_NO => 12,
            self::COL_ACCEPTANCE_DATE => 14,
            self::COL_PATIENT_NAME => 22,
            self::COL_TEST_CODES => 18,
            self::COL_TEST_NAMES => 28,
            self::COL_GROSS_AMOUNT => 14,
            self::COL_DISCOUNTS => 14,
            self::COL_NET_AMOUNT => 14,
            self::COL_CURRENCY => 8,
            self::COL_REPORTED_DATE => 14,
        ];

        foreach ($columnWidths as $colIndex => $width) {
            $column = $this->getColumnLetter($colIndex);
            $sheet->getColumnDimension($column)->setWidth($width);
        }
    }

    /**
     * Add footer with generation info
     */
    private function addFooter(Worksheet $sheet, int $highestRow): void
    {
        $footerRow = $highestRow + 8;
        $lastCol = $this->getColumnLetter(count($this->headers) - 1);

        $footerText = 'Generated on: ' . $this->options['generated_at'] . ' | Statement: ' . $this->options['statement_number'];
        $sheet->setCellValue('A' . $footerRow, $footerText);
        $sheet->mergeCells("A{$footerRow}:{$lastCol}{$footerRow}");

        $sheet->getStyle('A' . $footerRow)->getFont()->setSize(8)->setItalic(true);
        $sheet->getStyle('A' . $footerRow)->getFont()->getColor()->setRGB('888888');
        $sheet->getStyle('A' . $footerRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
    }

    /**
     * Static method to create export from array data - unchanged interface
     */
    public static function createFromArray(array $samples, array $options = []): self
    {
        $collection = collect($samples)->map(function ($sample) use ($options) {
            // Ensure all values are properly set with defaults
            $grossAmount = (float) ($sample['gross_amount'] ?? 0);
            $itemDiscounts = (float) ($sample['item_discounts'] ?? 0);
            $invoiceDiscount = (float) ($sample['invoice_discount'] ?? 0);
            $totalDiscounts = $itemDiscounts + $invoiceDiscount;
            $netAmount = (float) ($sample['net_amount'] ?? ($grossAmount - $totalDiscounts));

            return [
                $sample['invoice_no'] ?? 'N/A',
                $sample['acceptance_date'] ?? '',
                $sample['patient_name'] ?? 'N/A',
                $sample['test_codes'] ?? 'N/A',
                $sample['test_names'] ?? 'N/A',
                "$grossAmount",
                "$totalDiscounts",
                "$netAmount",
                $options['currency'] ?? self::CURRENCY,
                $sample['reported_at'] ?? '',
            ];
        });

        return new self($collection, $options);
    }
}
