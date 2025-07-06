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
use PhpOffice\PhpSpreadsheet\Exception;
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
    WithColumnWidths
{
    private const PRIMARY_COLOR = '0361ac';
    private const TEXT_COLOR = 'ffffff';
    private const BORDER_COLOR = 'CCCCCC';

    private const COLUMN_WIDTHS = [
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

    public function __construct(protected Collection $tests)
    {
        // Constructor body intentionally empty
    }

    public function collection(): Collection
    {
        return $this->tests;
    }

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

    public function columnWidths(): array
    {
        return self::COLUMN_WIDTHS;
    }

    public function map($test): array
    {
        return [
            $test->code,
            $test->name,
            $test->fullName,
            $test->testGroup?->name ?? '',
            $test->type->value ?? '',
            $this->formatPrice($test),
            $this->formatReferrerPrice($test),
            $this->formatMethods($test),
            $this->formatSampleTypes($test),
            $this->formatTurnaroundTime($test),
            strip_tags($test->description ?? ''),
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $this->configureSheet($event->sheet);
            },
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        $this->applyBordersAndAlignment($sheet);

        return [
            1 => $this->getHeaderStyle(),
            '2:' . $sheet->getHighestRow() => $this->getDataRowStyle(),
        ];
    }

    private function configureSheet($sheet): void
    {
        $lastColumn = $sheet->getHighestColumn();
        $lastRow = $sheet->getHighestRow();

        // Set auto filter and freeze panes
        $sheet->setAutoFilter("A1:{$lastColumn}1");
        $sheet->freezePane('A2');

        // Enable auto row height for all rows
        for ($row = 1; $row <= $lastRow; $row++) {
            $sheet->getRowDimension($row)->setRowHeight(-1);
        }
    }

    private function applyBordersAndAlignment(Worksheet $sheet): void
    {
        $lastColumn = $sheet->getHighestColumn();
        $lastRow = $sheet->getHighestRow();

        $sheet->getStyle("A1:{$lastColumn}{$lastRow}")->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => self::BORDER_COLOR],
                ],
            ],
            'alignment' => [
                'wrapText' => true,
                'vertical' => Alignment::VERTICAL_TOP,
            ],
        ]);
    }

    private function getHeaderStyle(): array
    {
        return [
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
        ];
    }

    private function getDataRowStyle(): array
    {
        return [
            'alignment' => [
                'wrapText' => true,
                'vertical' => Alignment::VERTICAL_TOP,
            ],
        ];
    }

    private function formatMethods(Test $test): string
    {
        if ($test->type === TestType::PANEL) {
            return $test->methodTests
                ->pluck('method.test.name')
                ->implode(', ');
        }

        return $test->methodTests->pluck('method.workflow.name')->implode(', ');
    }

    private function formatSampleTypes(Test $test): string
    {
        return $test->methodTests
            ->map(fn($methodTest) => $methodTest->method->test->sampleTypes->pluck('name'))
            ->flatten()
            ->unique()
            ->implode(', ');
    }

    private function formatPrice(Test $test): string
    {
        if ($test->type === TestType::PANEL) {
            return $this->formatPanelPrice($test);
        }

        return $this->formatMethodPrice($test);
    }

    private function formatReferrerPrice(Test $test): string
    {
        if ($test->type === TestType::PANEL) {
            return $this->formatPanelReferrerPrice($test);
        }

        return $this->formatMethodReferrerPrice($test);
    }

    private function formatPanelPrice(Test $test): string
    {
        return match ($test->price_type) {
            MethodPriceType::FIX => "{$test->price}\n",
            MethodPriceType::FORMULATE => "{$test->extra['formula']}\n",
            MethodPriceType::CONDITIONAL => $this->formatConditionalPrice($test->extra['conditions']),
            default => '-',
        };
    }

    private function formatPanelReferrerPrice(Test $test): string
    {
        return match ($test->referrer_price_type) {
            MethodPriceType::FIX => "{$test->referrer_price}\n",
            MethodPriceType::FORMULATE => "{$test->referrer_extra['formula']}\n",
            MethodPriceType::CONDITIONAL => $this->formatConditionalPrice($test->referrer_extra['conditions']),
            default => '-',
        };
    }

    private function formatMethodPrice(Test $test): string
    {
        $activeMethods = $test->methodTests->where('status', true);

        if ($activeMethods->count() === 1) {
            return $this->formatSingleMethodPrice($activeMethods->first()->method);
        }

        return $this->formatMultipleMethodPrices($activeMethods);
    }

    private function formatMethodReferrerPrice(Test $test): string
    {
        $activeMethods = $test->methodTests->where('status', true);

        if ($activeMethods->count() === 1) {
            return $this->formatSingleMethodReferrerPrice($activeMethods->first()->method);
        }

        return $this->formatMultipleMethodReferrerPrices($activeMethods);
    }

    private function formatSingleMethodPrice($method): string
    {
        return match ($method->price_type) {
            MethodPriceType::FIX => "{$method->price}\n",
            MethodPriceType::FORMULATE => "{$method->extra['formula']}\n",
            MethodPriceType::CONDITIONAL => $this->formatConditionalPrice($method->extra['conditions']),
            default => '-',
        };
    }

    private function formatSingleMethodReferrerPrice($method): string
    {
        return match ($method->referrer_price_type) {
            MethodPriceType::FIX => "{$method->referrer_price}\n",
            MethodPriceType::FORMULATE => "{$method->referrer_extra['formula']}\n",
            MethodPriceType::CONDITIONAL => $this->formatConditionalPrice($method->referrer_extra['conditions']),
            default => '-',
        };
    }

    private function formatMultipleMethodPrices($methods): string
    {
        $formatted = [];

        foreach ($methods as $methodTest) {
            $method = $methodTest->method;
            $formatted[] = match ($method->price_type) {
                MethodPriceType::FIX => "• {$method->name}: {$method->price}",
                MethodPriceType::FORMULATE => "• {$method->name}: {$method->extra['formula']}",
                MethodPriceType::CONDITIONAL => $this->formatMethodConditionalPrice($method),
                default => "• {$method->name}: -",
            };
        }

        return implode("\n", $formatted) ?: '-';
    }

    private function formatMultipleMethodReferrerPrices($methods): string
    {
        $formatted = [];

        foreach ($methods as $methodTest) {
            $method = $methodTest->method;
            $formatted[] = match ($method->referrer_price_type) {
                MethodPriceType::FIX => "• {$method->name}: {$method->referrer_price}",
                MethodPriceType::FORMULATE => "• {$method->name}: {$method->referrer_extra['formula']}",
                MethodPriceType::CONDITIONAL => $this->formatMethodConditionalReferrerPrice($method),
                default => "• {$method->name}: -",
            };
        }

        return implode("\n", $formatted) ?: '-';
    }

    private function formatConditionalPrice(array $conditions): string
    {
        $formatted = "Conditional Pricing:\n{\n";

        foreach ($conditions as $condition) {
            $conditionText = $this->formatConditionOperators($condition['condition']);
            $formatted .= "• {$conditionText}: {$condition['value']}\n";
        }

        return $formatted . "}\n";
    }

    private function formatMethodConditionalPrice($method): string
    {
        $formatted = "{$method->name} Conditional Pricing:\n{\n";

        foreach ($method->extra['conditions'] as $condition) {
            $conditionText = $this->formatConditionOperators($condition['condition']);
            $formatted .= "• {$conditionText}: {$condition['value']}\n";
        }

        return $formatted . "}\n";
    }

    private function formatMethodConditionalReferrerPrice($method): string
    {
        $formatted = "{$method->name} Conditional Pricing:\n{\n";

        foreach ($method->referrer_extra['conditions'] as $condition) {
            $conditionText = $this->formatConditionOperators($condition['condition']);
            $formatted .= "• {$conditionText}: {$condition['value']}\n";
        }

        return $formatted . "}\n";
    }

    private function formatConditionOperators(string $condition): string
    {
        return str_replace(
            ['==','<=', '>=', '&&', '||'],
            ['=',' ≤ ', ' ≥ ', ' and ', ' or '],
            $condition
        );
    }

    private function formatTurnaroundTime(Test $test): string
    {
        if ($test->type === TestType::PANEL) {
            $maxTurnaround = $test->methodTests
                ->map(fn($item) => $item->method->turnaround_time)
                ->max();

            return "{$maxTurnaround} Days";
        }

        $activeMethods = $test->methodTests->where('status', true);

        if ($activeMethods->count() === 1) {
            $turnaroundTime = $activeMethods->first()->method->turnaround_time;
            return "{$turnaroundTime} Days";
        }

        $formatted = [];
        foreach ($activeMethods as $methodTest) {
            $method = $methodTest->method;
            $formatted[] = "• {$method->name}: {$method->turnaround_time} Days";
        }

        return implode("\n", $formatted) ?: '-';
    }
}
