<?php

namespace App\Http\Controllers\Inventory;

use App\Domains\Inventory\Imports\ItemsImport;
use App\Domains\Inventory\Models\Item;
use App\Domains\Inventory\Services\ItemCodeService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;

class ItemImportController extends Controller
{
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
        Excel::import($import, $request->file('file'));

        $msg = "Imported {$import->imported} items.";
        if ($import->skipped > 0) $msg .= " Skipped {$import->skipped}.";

        return redirect()->route('inventory.items.index')
            ->with([
                'success' => $import->skipped === 0,
                'status'  => $msg,
                'import_errors' => $import->errors,
            ]);
    }

    public function template()
    {
        $this->authorize('create', Item::class);

        $headers = ['name', 'scientific_name', 'department', 'material_type', 'storage_condition',
            'default_unit', 'minimum_stock_level', 'maximum_stock_level', 'lead_time_days',
            'is_hazardous', 'requires_lot_tracking', 'notes', 'extra_unit_1', 'conversion_1', 'extra_unit_2', 'conversion_2'];

        $example = ['Paracetamol 500mg', 'Paracetamol', 'LAB', 'CHM', 'ROOM_TEMP',
            'Tablet', '100', '1000', '14', 'no', 'yes', '', 'Box', '100', '', ''];

        $csv = implode(',', $headers) . "\n" . implode(',', $example) . "\n";

        return response($csv, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="items-import-template.csv"',
        ]);
    }
}
