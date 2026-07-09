<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Exports;

use PhpOffice\PhpSpreadsheet\Cell\DataValidation;
use PhpOffice\PhpSpreadsheet\NamedRange;
use PhpOffice\PhpSpreadsheet\Reader\Xlsx as XlsxReader;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx as XlsxWriter;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Builds the items-import spreadsheet template (headers, example row, unit dropdowns,
 * hidden lookup sheet and data validations). When a macro-enabled base workbook exists
 * at resources/templates/items-import-base.xlsm it is refreshed with the current units
 * and streamed as .xlsm; otherwise a plain .xlsx template is generated from scratch.
 */
class ItemTemplateExport
{
    // Column index → letter map (1-based).
    private const COLS = [
        'name' => 'A',
        'scientific_name' => 'B',
        'department' => 'C',
        'material_type' => 'D',
        'storage_condition' => 'E',
        'default_unit' => 'F',
        'minimum_stock_level' => 'G',
        'maximum_stock_level' => 'H',
        'lead_time_days' => 'I',
        'is_hazardous' => 'J',
        'requires_lot_tracking' => 'K',
        'notes' => 'L',
        'extra_unit_1' => 'M',
        'conversion_1' => 'N',
        'extra_unit_2' => 'O',
        'conversion_2' => 'P',
    ];

    private const DATA_ROWS = '2:500';

    private const XLSM_CONTENT_TYPE = 'application/vnd.ms-excel.sheet.macroEnabled.12';

    private const XLSX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    /**
     * @param  list<string>  $units
     */
    public function __construct(private array $units) {}

    /**
     * Stream the template as a download, preferring the macro-enabled base workbook.
     */
    public function download(): StreamedResponse
    {
        $basePath = resource_path('templates/items-import-base.xlsm');

        if (file_exists($basePath)) {
            return $this->stream(
                $this->buildFromBase($basePath),
                self::XLSM_CONTENT_TYPE,
                'items-import-template.xlsm',
            );
        }

        return $this->stream(
            $this->buildFromScratch(),
            self::XLSX_CONTENT_TYPE,
            'items-import-template.xlsx',
        );
    }

    /**
     * Refresh the macro-enabled base workbook with the current units and validations.
     */
    public function buildFromBase(string $basePath): Spreadsheet
    {
        $unitCount = count($this->units);

        $reader = new XlsxReader;
        $spreadsheet = $reader->load($basePath);

        $sheet = $spreadsheet->getSheetByName('Items');
        $unitSheet = $spreadsheet->getSheetByName('_units');

        // Repopulate _units with fresh data from the database
        $oldHighest = $unitSheet->getHighestRow();
        for ($r = 1; $r <= $oldHighest; $r++) {
            $unitSheet->setCellValue("A{$r}", '');
        }
        foreach ($this->units as $i => $unit) {
            $unitSheet->setCellValue('A'.($i + 1), $unit);
        }

        // Refresh named range
        try {
            $spreadsheet->removeNamedRange('UnitsList');
        } catch (\Throwable) {
            // The base workbook may not contain the range yet; absence is
            // fine — it is (re-)added just below.
        }
        if ($unitCount > 0) {
            $spreadsheet->addNamedRange(new NamedRange(
                'UnitsList', $unitSheet, "\$A\$1:\$A\${$unitCount}"
            ));
        }

        // Re-apply unit dropdown validations with the correct row count
        if ($unitCount > 0) {
            $this->addListValidation($sheet, 'F', self::DATA_ROWS, '_units!$A$1:$A$'.$unitCount, 'Default Unit', false);
            $this->addListValidation($sheet, 'M', self::DATA_ROWS, '_units!$A$1:$A$'.$unitCount, 'Extra Unit 1', false);
            $this->addListValidation($sheet, 'O', self::DATA_ROWS, '_units!$A$1:$A$'.$unitCount, 'Extra Unit 2', false);
        }

        return $spreadsheet;
    }

    /**
     * Build the plain .xlsx template from scratch (headers, example row, validations).
     */
    public function buildFromScratch(): Spreadsheet
    {
        $unitCount = count($this->units);
        $spreadsheet = new Spreadsheet;

        // ── Sheet 1: Data ──────────────────────────────────────────────────────
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Items');

        $headers = array_keys(self::COLS);

        // Header row styling
        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '2563EB']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ];

        foreach ($headers as $col) {
            $letter = self::COLS[$col];
            $sheet->setCellValue("{$letter}1", $col);
            $sheet->getStyle("{$letter}1")->applyFromArray($headerStyle);
            $sheet->getColumnDimension($letter)->setWidth(match ($col) {
                'name', 'scientific_name', 'notes' => 28,
                'storage_condition' => 22,
                'department', 'material_type' => 16,
                default => 18,
            });
        }

        // Example row
        $example = [
            'Paracetamol 500mg', 'Paracetamol', 'LAB', 'CHM', 'ROOM_TEMP',
            $this->units[0] ?? 'Tablet', '100', '1000', '14', 'no', 'yes', '',
            $this->units[1] ?? '', '100', '', '',
        ];
        foreach ($example as $i => $val) {
            $letter = array_values(self::COLS)[$i];
            $sheet->setCellValue("{$letter}2", $val);
        }

        // Freeze header row
        $sheet->freezePane('A2');

        // ── Sheet 2: Units lookup (hidden) ────────────────────────────────────
        $unitSheet = $spreadsheet->createSheet();
        $unitSheet->setTitle('_units');
        foreach ($this->units as $i => $unit) {
            $unitSheet->setCellValue('A'.($i + 1), $unit);
        }
        $unitSheet->setSheetState(Worksheet::SHEETSTATE_HIDDEN);

        $spreadsheet->addNamedRange(new NamedRange(
            'UnitsList', $unitSheet, "\$A\$1:\$A\${$unitCount}"
        ));

        // ── Apply data validation to rows 2–500 ───────────────────────────────
        $this->addListValidation($sheet, 'C', self::DATA_ROWS, '"LAB,ADM,MNT,CLN,IT,FAC"', 'Department');
        $this->addListValidation($sheet, 'D', self::DATA_ROWS, '"CHM,SLD,LQD,ELC,CSM,BIO,GLS,PPE,RGT,OTH"', 'Material Type');
        $this->addListValidation($sheet, 'E', self::DATA_ROWS, '"ROOM_TEMP,REFRIGERATED,FROZEN,ULTRA_FROZEN,DRY_COOL,FLAMMABLE_CABINET"', 'Storage Condition');
        $this->addListValidation($sheet, 'J', self::DATA_ROWS, '"yes,no"', 'Is Hazardous');
        $this->addListValidation($sheet, 'K', self::DATA_ROWS, '"yes,no"', 'Requires Lot Tracking');

        if ($unitCount > 0) {
            $this->addListValidation($sheet, 'F', self::DATA_ROWS, '_units!$A$1:$A$'.$unitCount, 'Default Unit', false);
            $this->addListValidation($sheet, 'M', self::DATA_ROWS, '_units!$A$1:$A$'.$unitCount, 'Extra Unit 1', false);
            $this->addListValidation($sheet, 'O', self::DATA_ROWS, '_units!$A$1:$A$'.$unitCount, 'Extra Unit 2', false);
        }

        return $spreadsheet;
    }

    private function stream(Spreadsheet $spreadsheet, string $contentType, string $filename): StreamedResponse
    {
        $writer = new XlsxWriter($spreadsheet);

        return response()->stream(function () use ($writer) {
            $writer->save('php://output');
        }, 200, [
            'Content-Type' => $contentType,
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Cache-Control' => 'max-age=0',
        ]);
    }

    private function addListValidation(
        Worksheet $sheet,
        string $col,
        string $rows,
        string $formula,
        string $prompt,
        bool $quoted = true,
    ): void {
        $validation = $sheet->getCell("{$col}2")->getDataValidation();
        $validation->setType(DataValidation::TYPE_LIST);
        $validation->setErrorStyle(DataValidation::STYLE_INFORMATION);
        $validation->setAllowBlank(true);
        $validation->setShowDropDown(false); // false = show arrow
        $validation->setShowErrorMessage(true);
        $validation->setShowInputMessage(true);
        $validation->setPromptTitle($prompt);
        $validation->setPrompt('Select a value from the list.');
        $validation->setError('Invalid value. Please choose from the dropdown.');
        $validation->setFormula1($formula);

        // Clone to each row in range
        [$from, $to] = explode(':', $rows);
        for ($row = (int) $from; $row <= (int) $to; $row++) {
            $sheet->getCell("{$col}{$row}")->setDataValidation(clone $validation);
        }
    }
}
