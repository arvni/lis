<?php

namespace App\Http\Controllers\Inventory;

use App\Domains\Inventory\Imports\ItemsImport;
use App\Domains\Inventory\Models\Item;
use App\Domains\Inventory\Models\Unit;
use App\Domains\Inventory\Services\ItemCodeService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ItemImportController extends Controller
{
    // Column index → letter map (1-based)
    private const COLS = [
        'name'                 => 'A',
        'scientific_name'      => 'B',
        'department'           => 'C',
        'material_type'        => 'D',
        'storage_condition'    => 'E',
        'default_unit'         => 'F',
        'minimum_stock_level'  => 'G',
        'maximum_stock_level'  => 'H',
        'lead_time_days'       => 'I',
        'is_hazardous'         => 'J',
        'requires_lot_tracking'=> 'K',
        'notes'                => 'L',
        'extra_unit_1'         => 'M',
        'conversion_1'         => 'N',
        'extra_unit_2'         => 'O',
        'conversion_2'         => 'P',
    ];

    public function __construct(private ItemCodeService $itemCodeService) {}

    public function create(): Response
    {
        $this->authorize('create', Item::class);
        return Inertia::render('Inventory/Items/Import');
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Item::class);

        $request->validate([
            'file' => [
                'required', 'file', 'max:10240',
                'mimetypes:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,'
                    . 'application/vnd.ms-excel,'
                    . 'text/csv,text/plain,application/csv,application/octet-stream',
            ],
        ]);

        $import = new ItemsImport($this->itemCodeService);

        try {
            Excel::import($import, $request->file('file'));
        } catch (\Throwable $e) {
            return back()->withErrors(['file' => 'Import failed: ' . $e->getMessage()]);
        }

        $msg = "Imported {$import->imported} item(s).";
        if ($import->skipped > 0) $msg .= " Skipped {$import->skipped} row(s) due to errors.";

        return redirect()->route('inventory.items.import.create')
            ->with([
                'success'       => $import->imported > 0 && $import->skipped === 0,
                'status'        => $msg,
                'import_errors' => $import->errors,
            ]);
    }

    public function template(): StreamedResponse
    {
        $this->authorize('create', Item::class);

        $units     = Unit::orderBy('name')->pluck('name')->toArray();
        $unitCount = count($units);

        $spreadsheet = new Spreadsheet();

        // ── Sheet 1: Data ──────────────────────────────────────────────────────
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Items');

        $headers = array_keys(self::COLS);

        // Header row styling
        $headerStyle = [
            'font'      => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '2563EB']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ];

        foreach ($headers as $i => $col) {
            $letter = self::COLS[$col];
            $sheet->setCellValue("{$letter}1", $col);
            $sheet->getStyle("{$letter}1")->applyFromArray($headerStyle);
            $sheet->getColumnDimension($letter)->setWidth(match ($col) {
                'name', 'scientific_name', 'notes' => 28,
                'storage_condition'                 => 22,
                'department', 'material_type'       => 16,
                default                             => 18,
            });
        }

        // Example row
        $example = [
            'Paracetamol 500mg', 'Paracetamol', 'LAB', 'CHM', 'ROOM_TEMP',
            $units[0] ?? 'Tablet', '100', '1000', '14', 'no', 'yes', '',
            $units[1] ?? '', '100', '', '',
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
        foreach ($units as $i => $unit) {
            $unitSheet->setCellValue("A" . ($i + 1), $unit);
        }
        $unitSheet->setSheetState(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet::SHEETSTATE_HIDDEN);

        // Name the units range so we can reference it in validation
        $spreadsheet->addNamedRange(new \PhpOffice\PhpSpreadsheet\NamedRange(
            'UnitsList',
            $unitSheet,
            "\$A\$1:\$A\${$unitCount}"
        ));

        // ── Apply data validation to rows 2–500 ───────────────────────────────
        $dataRows = '2:500';

        $this->addListValidation($sheet, 'C', $dataRows, '"LAB,ADM,MNT,CLN,IT,FAC"', 'Department');
        $this->addListValidation($sheet, 'D', $dataRows, '"CHM,SLD,LQD,ELC,CSM,BIO,GLS,PPE,RGT,OTH"', 'Material Type');
        $this->addListValidation($sheet, 'E', $dataRows, '"ROOM_TEMP,REFRIGERATED,FROZEN,ULTRA_FROZEN,DRY_COOL,FLAMMABLE_CABINET"', 'Storage Condition');
        $this->addListValidation($sheet, 'J', $dataRows, '"yes,no"', 'Is Hazardous');
        $this->addListValidation($sheet, 'K', $dataRows, '"yes,no"', 'Requires Lot Tracking');

        // Unit columns reference the named range (works across sheets)
        if ($unitCount > 0) {
            $this->addListValidation($sheet, 'F', $dataRows, '_units!$A$1:$A$' . $unitCount, 'Default Unit', false);
            $this->addListValidation($sheet, 'M', $dataRows, '_units!$A$1:$A$' . $unitCount, 'Extra Unit 1', false);
            $this->addListValidation($sheet, 'O', $dataRows, '_units!$A$1:$A$' . $unitCount, 'Extra Unit 2', false);
        }

        // ── Stream response ───────────────────────────────────────────────────
        $writer = new Xlsx($spreadsheet);

        return response()->stream(function () use ($writer) {
            $writer->save('php://output');
        }, 200, [
            'Content-Type'        => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="items-import-template.xlsx"',
            'Cache-Control'       => 'max-age=0',
        ]);
    }

    private function addListValidation(
        \PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $sheet,
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
        $validation->setPrompt("Select a value from the list.");
        $validation->setError("Invalid value. Please choose from the dropdown.");
        $validation->setFormula1($formula);

        // Clone to each row in range
        [$from, $to] = explode(':', $rows);
        for ($row = (int) $from; $row <= (int) $to; $row++) {
            $sheet->getCell("{$col}{$row}")->setDataValidation(clone $validation);
        }
    }
}
