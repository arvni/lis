<?php

namespace App\Domains\Laboratory\Exports;

use App\Domains\Laboratory\Enums\MethodPriceType;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Laboratory\Enums\TestType;
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
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class TestExport implements
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

    /**
     * @return Collection
     */
    public function collection()
    {
        return Test::with([
            'testGroup',
            'methodTests.method.test.sampleTypes',
            'methodTests.method.workflow',
        ])->active()->get();
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
            'Referrer Price',
            'Methods',
            'Sample Types',
            'TAT',
            'Description',
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
            'G' => 35,  // Referrer Price
            'H' => 25,  // Methods
            'I' => 25,  // Sample Types
            'J' => 15,  // Turnaround Time
            'K' => 40,  // Description
        ];
    }

    /**
     * @param Test $test
     * @return array
     */
    public function map($test): array
    {
        // Get methods based on test type
        $methods = $this->getTestMethods($test);

        // Get sample types
        $sampleTypes = $test->methodTests->map(fn($methodTest) => $methodTest->method->test->sampleTypes->pluck('name'))->flatten()->unique()->implode(", ");

        return [
            $test->code,
            $test->name,
            $test->fullName,
            $test->testGroup?->name ?? '',
            $test->type->value ?? '',
            $this->getPrice($test),
            $this->getReferrerPrice($test),
            $methods,
            $sampleTypes,
            $this->getTurnaroundTime($test),
            strip_tags($test->description),
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

    /**
     * Get methods for the test based on test type
     *
     * @param Test $test
     * @return string
     */
    private function getTestMethods(Test $test): string
    {
        if ($test->type === TestType::PANEL) {
            // For panel tests, get methods from test type test methods
            return $test->methodTests
                ->pluck('method.test.name')
                ->implode(', ');
        }

        // For other test types, get methods directly
        return $test->methodTests->pluck('method.workflow.name')->implode(', ');
    }

    /**
     * Get default method for the test
     *
     * @param Test $test
     * @return string
     */
    private function getDefaultMethod(Test $test): string
    {
        if ($test->type === TestType::PANEL) {
            // For panel tests, get default method from method tests
            $defaultMethodTest = $test->methodTests
                ->where('is_default', true)->pluck('method.test.name')->implode(", ");

            return $defaultMethodTest;
        }

        // For other test types, get default method from pivot
        return $test->methodTests
            ->where('is_default', true)
            ->first()?->method?->name ?? '';
    }

    private function getPrice(Test $test): string
    {
        if ($test->type == TestType::PANEL) {
            return $test->price;
        }

        if ($test->methodTests->where("status", true)->count() ==1) {
            $method=$test->methodTests->where("status", true)->first()->method;
            if ($method->price_type == MethodPriceType::FIX) {
                return "{$method->price}\n";
            } else if ($method->price_type == MethodPriceType::FORMULATE)
                return "{$method->extra["formula"]}\n";
            else if ($method->price_type == MethodPriceType::CONDITIONAL) {
                $formatted = "Conditional Pricing:\n { \n";
                foreach ($method->extra['conditions'] as $index => $condition) {
                    $conditionText = str_replace(['<=', '>=', '&&', '||'], [' ≤ ', ' ≥ ', ' and ', ' or '], $condition['condition']);
                    $formatted .= "• {$conditionText}: {$condition['value']}\n";
                }
                $formatted .= "}\n";
                return $formatted;
            }
        }

        $formatted = "";
        foreach ($test->methodTests->where("status", true) as $methodTest) {
            $method = $methodTest->method;
            if ($method->referrer_price_type == MethodPriceType::FIX) {
                $formatted .= "• {$method->name}: {$method->price}\n";
            } else if ($method->referrer_price_type == MethodPriceType::FORMULATE)
                $formatted .= "• {$method->name}: {$method->extra["formula"]}\n";
            else if ($method->referrer_price_type == MethodPriceType::CONDITIONAL) {
                $formatted = "$method->name Conditional Pricing:\n {\n";
                foreach ($method->extra['conditions'] as $index => $condition) {
                    $conditionText = str_replace(['<=', '>=', '&&', '||'], [' ≤ ', ' ≥ ', ' and ', ' or '], $condition['condition']);
                    $formatted .= "• {$conditionText}: {$condition['value']}\n";
                }
                $formatted .= "}\n";
            }
        }
        return $formatted !== "" ? $formatted : "-";
    }

    private function getReferrerPrice(Test $test): string
    {
        if ($test->type == TestType::PANEL) {
            return $test->referrer_price;
        }

        if ($test->methodTests->where("status", true)->count() ==1) {
            $method=$test->methodTests->where("status", true)->first()->method;
            if ($method->referrer_price_type == MethodPriceType::FIX) {
                return "{$method->referrer_price}\n";
            } else if ($method->referrer_price_type == MethodPriceType::FORMULATE)
               return "{$method->referrer_extra["formula"]}\n";
            else if ($method->referrer_price_type == MethodPriceType::CONDITIONAL) {
                $formatted = "$method->name Conditional Pricing:\n { \n";
                foreach ($method->referrer_extra['conditions'] as $index => $condition) {
                    $conditionText = str_replace(['<=', '>=', '&&', '||'], [' ≤ ', ' ≥ ', ' and ', ' or '], $condition['condition']);
                    $formatted .= "• {$conditionText}: {$condition['value']}\n";
                }
                $formatted .= "}\n";
                return $formatted;
            }
        }

        $formatted = "";
        foreach ($test->methodTests->where("status", true) as $methodTest) {
            $method = $methodTest->method;
            if ($method->referrer_price_type == MethodPriceType::FIX) {
                $formatted .= "• {$method->name}: {$method->referrer_price}\n";
            } else if ($method->referrer_price_type == MethodPriceType::FORMULATE)
                $formatted .= "• {$method->name}: {$method->referrer_extra["formula"]}\n";
            else if ($method->referrer_price_type == MethodPriceType::CONDITIONAL) {
                $formatted = "$method->name Conditional Pricing:\n { \n";
                foreach ($method->referrer_extra['conditions'] as $index => $condition) {
                    $conditionText = str_replace(['<=', '>=', '&&', '||'], [' ≤ ', ' ≥ ', ' and ', ' or '], $condition['condition']);
                    $formatted .= "• {$conditionText}: {$condition['value']}\n";
                }
                $formatted .= "}\n";
            }
        }
        return $formatted !== "" ? $formatted : "-";
    }

    private function getTurnaroundTime(Test $test): string
    {
        if ($test->type == TestType::PANEL) {
            return $test->methodTests->map(fn($item)=>$item->method->turnaround_time)->max();
        }
        if ($test->methodTests->count() ==1) {
            $method=$test->methodTests->first()->method;
            return "{$method->turnaround_time} Day\n";
        }
        $formatted = "";
        foreach ($test->methodTests->where("status", true) as $methodTest) {
            $method = $methodTest->method;
                $formatted .= "• {$method->name}: {$method->turnaround_time} Day\n";
        }
        return $formatted !== "" ? $formatted : "-";
    }
}
