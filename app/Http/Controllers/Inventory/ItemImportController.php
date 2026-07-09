<?php

namespace App\Http\Controllers\Inventory;

use App\Domains\Inventory\Enums\ItemDepartment;
use App\Domains\Inventory\Enums\ItemMaterialType;
use App\Domains\Inventory\Enums\StorageCondition;
use App\Domains\Inventory\Exports\ItemTemplateExport;
use App\Domains\Inventory\Imports\ItemsImport;
use App\Domains\Inventory\Models\Item;
use App\Domains\Inventory\Models\Unit;
use App\Domains\Inventory\Requests\ImportItemFileRequest;
use App\Domains\Inventory\Requests\ImportItemRowsRequest;
use App\Domains\Inventory\Services\ItemCodeService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ItemImportController extends Controller
{
    public function __construct(private ItemCodeService $itemCodeService) {}

    public function create(): Response
    {
        $this->authorize('create', Item::class);

        return Inertia::render('Inventory/Items/Import', [
            'departments' => ItemDepartment::toOptions(),
            'materialTypes' => ItemMaterialType::toOptions(),
            'storageConditions' => StorageCondition::toOptions(),
            'units' => Unit::orderBy('name')->pluck('name')->toArray(),
        ]);
    }

    public function store(ImportItemFileRequest $request): RedirectResponse
    {
        $this->authorize('create', Item::class);

        $import = new ItemsImport($this->itemCodeService);

        try {
            Excel::import($import, $request->file('file'));
        } catch (\Throwable $e) {
            return back()->withErrors(['file' => 'Import failed: '.$e->getMessage()]);
        }

        $msg = "Imported {$import->imported} item(s).";
        if ($import->skipped > 0) {
            $msg .= " Skipped {$import->skipped} row(s) due to errors.";
        }

        return redirect()->route('inventory.items.import.create')
            ->with([
                'success' => $import->imported > 0 && $import->skipped === 0,
                'status' => $msg,
                'import_errors' => $import->errors,
            ]);
    }

    public function storeRows(ImportItemRowsRequest $request): RedirectResponse
    {
        $this->authorize('create', Item::class);

        $import = new ItemsImport($this->itemCodeService);
        $import->collection(collect($request->input('rows')));

        $msg = "Imported {$import->imported} item(s).";
        if ($import->skipped > 0) {
            $msg .= " Skipped {$import->skipped} row(s) due to errors.";
        }

        return redirect()->route('inventory.items.import.create')
            ->with([
                'success' => $import->imported > 0 && $import->skipped === 0,
                'status' => $msg,
                'import_errors' => $import->errors,
            ]);
    }

    public function template(): StreamedResponse
    {
        $this->authorize('create', Item::class);

        $units = Unit::orderBy('name')->pluck('name')->toArray();

        return (new ItemTemplateExport($units))->download();
    }
}
