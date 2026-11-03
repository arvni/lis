<?php

declare(strict_types=1);

namespace Tests\Feature\Billing;

use App\Domains\Billing\Exports\MonthlyStatementExport;
use Maatwebsite\Excel\Excel as ExcelFormat;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Worksheet\PageSetup;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Tests\TestCase;

class MonthlyStatementExportTest extends TestCase
{
    public function test_the_statement_prints_on_one_landscape_page_width_with_the_logo_top_right(): void
    {
        $sheet = $this->export();
        $setup = $sheet->getPageSetup();

        $this->assertSame(PageSetup::ORIENTATION_LANDSCAPE, $setup->getOrientation());
        $this->assertSame(PageSetup::PAPERSIZE_A4, $setup->getPaperSize());
        $this->assertTrue($setup->getFitToPage());
        $this->assertSame(1, $setup->getFitToWidth());
        $this->assertSame(0, $setup->getFitToHeight());
        $this->assertEquals([8, 8], $setup->getRowsToRepeatAtTop());

        $drawings = $sheet->getDrawingCollection();
        $this->assertCount(1, $drawings);
        $this->assertSame('J1', $drawings[0]->getCoordinates());
    }

    public function test_the_rows_and_totals_are_unchanged(): void
    {
        $sheet = $this->export();

        $this->assertSame('MONTHLY BILLING STATEMENT', $sheet->getCell('A1')->getValue());
        $this->assertSame('Invoice No.', $sheet->getCell('A8')->getValue());
        $this->assertSame('INV-1', $sheet->getCell('A9')->getValue());
        $this->assertSame('INV-2', $sheet->getCell('A10')->getValue());
        $this->assertEqualsWithDelta(27.5, (float) $sheet->getCell('I16')->getValue(), 0.0001);
    }

    private function export(): Worksheet
    {
        $export = MonthlyStatementExport::createFromArray([
            ['invoice_no' => 'INV-1', 'patient_name' => 'Test Patient', 'test_codes' => 'T1', 'test_names' => 'Test one', 'gross_amount' => 20, 'item_discounts' => 2, 'invoice_discount' => 0, 'net_amount' => 18],
            ['invoice_no' => 'INV-2', 'patient_name' => 'Other Patient', 'test_codes' => 'T2', 'test_names' => 'Test two', 'gross_amount' => 10, 'item_discounts' => 0, 'invoice_discount' => 0.5, 'net_amount' => 9.5],
        ], ['customer_name' => 'Clinic', 'statement_number' => 'ST-1', 'total_samples' => 2]);

        $path = tempnam(sys_get_temp_dir(), 'statement').'.xlsx';
        file_put_contents($path, Excel::raw($export, ExcelFormat::XLSX));

        try {
            return IOFactory::load($path)->getActiveSheet();
        } finally {
            @unlink($path);
        }
    }
}
