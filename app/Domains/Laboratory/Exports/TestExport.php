<?php

namespace App\Domains\Laboratory\Exports;

use App\Domains\Laboratory\Enums\MethodPriceType;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Laboratory\Enums\TestType;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStrictNullComparison;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
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
    WithEvents
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
        ])->get();
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
            'Description',
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
                $sheet->setAutoFilter("A1:{$lastColumn}1");

                // Freeze the top row
                $sheet->freezePane('A2');

                // Set width for parameter column
                $sheet->getColumnDimension('A')->setWidth(15);
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
        $defaultMethod = $test->methodTests->where("is_default")->first()->method;
        if ($defaultMethod->price_type == MethodPriceType::FIX)
            return $defaultMethod->price;
        else if ($defaultMethod->price_type == MethodPriceType::FORMULATE)
            return $defaultMethod->extra["formula"];
        else if ($defaultMethod->price_type == MethodPriceType::CONDITIONAL) {
            $formatted = "Conditional Pricing:\n";
            foreach ($defaultMethod->extra['conditions'] as $index => $condition) {
                $conditionText = str_replace(['<=', '>=', '&&', '||'], ['≤', '≥', ' and ', ' or '], $condition['condition']);
                $formatted .= "• {$conditionText}: \${$condition['value']}\n";
            }
            return trim($formatted);
        }
        return "-";
    }

    private function getReferrerPrice(Test $test): string
    {
        if ($test->type == TestType::PANEL) {
            return $test->referrer_price;
        }
        $defaultMethod = $test->methodTests->where("is_default")->first()->method;
        if ($defaultMethod->referrer_price_type == MethodPriceType::FIX)
            return $defaultMethod->referrer_price;
        else if ($defaultMethod->referrer_price_type == MethodPriceType::FORMULATE)
            return $defaultMethod->referrer_extra["formulate"];
        else if ($defaultMethod->referrer_price_type == MethodPriceType::CONDITIONAL) {
            $formatted = "Conditional Pricing:\n";
            foreach ($defaultMethod->referrer_extra['conditions'] as $index => $condition) {
                $conditionText = str_replace(['<=', '>=', '&&', '||'], ['≤', '≥', ' and ', ' or '], $condition['condition']);
                $formatted .= "• {$conditionText}: \${$condition['value']}\n";
            }
            return trim($formatted);
        }
        return "-";
    }
}
