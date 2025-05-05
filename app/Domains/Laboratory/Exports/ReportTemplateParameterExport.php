<?php

namespace App\Domains\Laboratory\Exports;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ReportTemplateParameterExport implements
    FromArray,
    WithHeadings,
    ShouldAutoSize,
    WithStyles,
    WithTitle,
    WithEvents
{
    private const PRIMARY_COLOR = '0361ac';
    private const TEXT_COLOR = 'ffffff';

    private array $headers;
    private array $parameters;
    private string $worksheetTitle;

    public function __construct(Collection $parameters, string $worksheetTitle = 'Parameters')
    {
        $this->worksheetTitle = $worksheetTitle;
        $this->headers = $parameters->map(fn($item) => $item->title)->toArray();
        $this->parameters = $parameters->map(
            fn($item) => '${' . $this->formatParameterName($item->title) . "_" . $item->id . '}'
        )->toArray();
    }

    /**
     * Get the data array for the Excel export
     *
     * @return array
     */
    public function array(): array
    {
        return [
            ["Element", ...$this->parameters],
            ["Value", ...array_fill(0, count($this->parameters), "")]
        ];
    }

    /**
     * Get the column headings
     *
     * @return array
     */
    public function headings(): array
    {
        return ["Title", ...$this->headers];
    }

    /**
     * Set the worksheet title
     *
     * @return string
     */
    public function title(): string
    {
        return $this->worksheetTitle;
    }

    /**
     * Register events for the worksheet
     *
     * @return array
     */
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
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
            // First column styling
            'A2' => [
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
            'A3' => [
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
     * Format parameter name from title
     *
     * @param string $title
     * @return string
     */
    private function formatParameterName(string $title): string
    {
        return strtolower(implode("_", explode("-", Str::slug($title))));
    }
}
