<?php

declare(strict_types=1);

namespace Tests\Unit\Inventory;

use App\Domains\Inventory\Exports\ItemTemplateExport;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PHPUnit\Framework\TestCase;

/**
 * Pure-unit coverage for the items-import template builder (no DB, no HTTP):
 * asserts the from-scratch .xlsx structure that was previously inlined in
 * ItemImportController — headers, example row, hidden units lookup, named range
 * and the unit/enum dropdown validations.
 */
class ItemTemplateExportTest extends TestCase
{
    /** @var list<string> */
    private const HEADERS = [
        'name', 'scientific_name', 'department', 'material_type', 'storage_condition',
        'default_unit', 'minimum_stock_level', 'maximum_stock_level', 'lead_time_days',
        'is_hazardous', 'requires_lot_tracking', 'notes',
        'extra_unit_1', 'conversion_1', 'extra_unit_2', 'conversion_2',
    ];

    public function test_headers_are_written_across_row_one(): void
    {
        $sheet = $this->itemsSheet(['Tablet', 'Bottle']);

        foreach (self::HEADERS as $index => $label) {
            $letter = chr(65 + $index); // A, B, C, ...
            $this->assertSame($label, $sheet->getCell("{$letter}1")->getValue());
        }
    }

    public function test_example_row_uses_the_first_two_units(): void
    {
        $sheet = $this->itemsSheet(['Tablet', 'Bottle']);

        $this->assertSame('Paracetamol 500mg', $sheet->getCell('A2')->getValue());
        $this->assertSame('Tablet', $sheet->getCell('F2')->getValue());  // default_unit ← units[0]
        $this->assertSame('Bottle', $sheet->getCell('M2')->getValue());  // extra_unit_1 ← units[1]
    }

    public function test_example_row_falls_back_when_units_are_missing(): void
    {
        $sheet = $this->itemsSheet([]);

        $this->assertSame('Tablet', $sheet->getCell('F2')->getValue()); // default_unit fallback
        $this->assertSame('', $sheet->getCell('M2')->getValue());       // extra_unit_1 fallback
    }

    public function test_units_are_written_to_a_hidden_lookup_sheet_with_a_named_range(): void
    {
        $spreadsheet = (new ItemTemplateExport(['Tablet', 'Bottle']))->buildFromScratch();
        $unitSheet = $spreadsheet->getSheetByName('_units');

        $this->assertNotNull($unitSheet);
        $this->assertSame(Worksheet::SHEETSTATE_HIDDEN, $unitSheet->getSheetState());
        $this->assertSame('Tablet', $unitSheet->getCell('A1')->getValue());
        $this->assertSame('Bottle', $unitSheet->getCell('A2')->getValue());
        $this->assertTrue($spreadsheet->getNamedRange('UnitsList') !== null);
    }

    public function test_enum_columns_get_list_validations(): void
    {
        $sheet = $this->itemsSheet(['Tablet']);

        // Department column (C) is a quoted enum list.
        $department = $sheet->getCell('C2')->getDataValidation();
        $this->assertSame(DataValidation::TYPE_LIST, $department->getType());
        $this->assertStringContainsString('LAB', $department->getFormula1());

        // Default-unit column (F) references the _units lookup sheet.
        $defaultUnit = $sheet->getCell('F2')->getDataValidation();
        $this->assertSame(DataValidation::TYPE_LIST, $defaultUnit->getType());
        $this->assertSame('_units!$A$1:$A$1', $defaultUnit->getFormula1());
    }

    public function test_unit_validations_are_skipped_when_there_are_no_units(): void
    {
        $sheet = $this->itemsSheet([]);

        // Enum validation still applied...
        $this->assertSame(DataValidation::TYPE_LIST, $sheet->getCell('C2')->getDataValidation()->getType());
        // ...but the unit-backed dropdown is not.
        $this->assertSame(DataValidation::TYPE_NONE, $sheet->getCell('F2')->getDataValidation()->getType());
    }

    /**
     * @param  list<string>  $units
     */
    private function itemsSheet(array $units): Worksheet
    {
        return (new ItemTemplateExport($units))->buildFromScratch()->getSheetByName('Items');
    }
}
