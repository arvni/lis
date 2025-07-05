<?php

namespace App\Domains\Referrer\Exports;

use App\Domains\Laboratory\Enums\MethodPriceType;
use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\Method;
use App\Domains\Referrer\Models\ReferrerTest;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStrictNullComparison;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Exception;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ReferrerTestExport implements
    FromCollection,
    WithHeadings,
    WithMapping,
    WithStrictNullComparison,
    ShouldAutoSize,
    WithStyles,
    WithEvents,
    WithColumnWidths  // Add this interface
{

    private const PRIMARY_COLOR = '0361ac';
    private const TEXT_COLOR = 'ffffff';

    public function __construct(protected Collection $tests)
    {

    }

    /**
     * @return Collection
     */
    public function collection(): Collection
    {
        return $this->tests;
    }

    /**
     * @return array
     */
    public function headings(): array
    {
        return [
            'Code',
            'Name',
            'Full Name',
            'Test Group',
            'Type',
            'Price',
        ];
    }

    /**
     * Set column widths
     *
     * @return array
     */
    public function columnWidths(): array
    {
        return [
            'A' => 15,  // Code
            'B' => 25,  // Name
            'C' => 35,  // Full Name
            'D' => 20,  // Test Group
            'E' => 15,  // Type
            'F' => 35,  // Price
        ];
    }

    /**
     * @param ReferrerTest $referrerTest
     * @return array
     */
    public function map($referrerTest): array
    {

        return [
            $referrerTest->test->code,
            $referrerTest->test->name,
            $referrerTest->test->fullName,
            $referrerTest->test->testGroup?->name ?? '',
            $referrerTest->test->type->value ?? '',
            $this->getPrice($referrerTest),
        ];
    }

    /**
     * Register events for the worksheet
     *
     * @return array
     */
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet;

                // Auto-filter for easier sorting/filtering
                $lastColumn = $sheet->getHighestColumn();
                $lastRow = $sheet->getHighestRow();
                $sheet->setAutoFilter("A1:{$lastColumn}1");

                // Freeze the top row
                $sheet->freezePane('A2');

                // Enable auto row height for all rows
                for ($row = 1; $row <= $lastRow; $row++) {
                    $sheet->getRowDimension($row)->setRowHeight(-1); // -1 enables auto height
                }

                // Alternative: Set auto height for data rows only (excluding header)
                // for ($row = 2; $row <= $lastRow; $row++) {
                //     $sheet->getRowDimension($row)->setRowHeight(-1);
                // }
            },
        ];
    }

    /**
     * Apply styles to the worksheet
     *
     * @param Worksheet $sheet
     * @return array
     * @throws Exception
     */
    public function styles(Worksheet $sheet): array
    {
        $lastColumn = $sheet->getHighestColumn();
        $lastRow = $sheet->getHighestRow();

        // Apply borders to all cells
        $sheet->getStyle("A1:{$lastColumn}{$lastRow}")->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => 'CCCCCC'],
                ],
            ],
            'alignment' => [
                'wrapText' => true,  // Enable text wrapping
                'vertical' => Alignment::VERTICAL_TOP, // Align text to top
            ],
        ]);

        return [
            // Header row styling
            1 => [
                'font' => [
                    'bold' => true,
                    'color' => ['rgb' => self::TEXT_COLOR]
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'color' => ['rgb' => self::PRIMARY_COLOR],
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical' => Alignment::VERTICAL_CENTER,
                    'wrapText' => true,
                ],
            ],
            // Data rows styling
            '2:' . $sheet->getHighestRow() => [
                'alignment' => [
                    'wrapText' => true,
                    'vertical' => Alignment::VERTICAL_TOP,
                ],
            ],
        ];
    }

    private function getPrice(ReferrerTest $referrerTest): string
    {
        if ($referrerTest->test->type == TestType::PANEL) {
            return $referrerTest->price;
        }

        if ($referrerTest->test->methodTests->where("status", true)->count() ==1) {
            $method=$referrerTest->test->methodTests->where("status", true)->first()->method;
            $referrerTestMethod=collect($referrerTest->methods)->where("method_id", $method->id)->first();
            if ($referrerTestMethod) {
                $method =new Method($referrerTestMethod);
            }
            if ($method->price_type == MethodPriceType::FIX) {
                return "{$method->price}\n";
            } else if ($method->price_type == MethodPriceType::FORMULATE)
                return "{$method->extra["formula"]}\n";
            else if ($method->price_type == MethodPriceType::CONDITIONAL) {
                $formatted = "Conditional Pricing:\n { \n";
                foreach ($method->extra['conditions'] as $index => $condition) {
                    $conditionText = str_replace(['==','<=', '>=', '&&', '||'], [' = ',' ≤ ', ' ≥ ', ' and ', ' or '], $condition['condition']);
                    $formatted .= "• {$conditionText}: {$condition['value']}\n";
                }
                $formatted .= "}\n";
                return $formatted;
            }
        }

        $formatted = "";
        foreach ($referrerTest->test->methodTests->where("status", true) as $methodTest) {
            $method = $methodTest->method;
            $referrerTestMethod=collect($referrerTest->methods)->where("method_id", $method->id)->first();
            if ($referrerTestMethod)
                $method =new Method([...$referrerTestMethod,"name"=>$method->name]);
            if ($method->price_type == MethodPriceType::FIX) {
                $formatted .= "• {$method->name}: {$method->price}\n";
            } else if ($method->price_type == MethodPriceType::FORMULATE)
                $formatted .= "• {$method->name}: {$method->extra["formula"]}\n";
            else if ($method->price_type == MethodPriceType::CONDITIONAL) {
                $formatted = "$method->name Conditional Pricing:\n {\n";
                foreach ($method->extra['conditions'] as $index => $condition) {
                    $conditionText = str_replace(['==','<=', '>=', '&&', '||'], [' = ',' ≤ ', ' ≥ ', ' and ', ' or '], $condition['condition']);
                    $formatted .= "• {$conditionText}: {$condition['value']}\n";
                }
                $formatted .= "}\n";
            }
        }
        return $formatted !== "" ? $formatted : "-";
    }
}
