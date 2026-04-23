<?php

namespace App\Http\Controllers\Inventory;

use App\Domains\Inventory\Models\Unit;
use App\Domains\Inventory\Services\UnitService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UnitController extends Controller
{
    public function __construct(private UnitService $unitService)
    {
        $this->middleware('indexProvider')->only('index');
    }

    public function index(Request $request): Response
    {
        $requestInputs = $request->all();
        $units = $this->unitService->listUnits($requestInputs);
        return Inertia::render('Inventory/Units/Index', compact('units', 'requestInputs'));
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name'         => 'required|string|max:100',
            'abbreviation' => 'required|string|max:20',
            'description'  => 'nullable|string',
        ]);
        $this->unitService->createUnit($data);
        return back()->with(['success' => true, 'status' => "Unit {$data['name']} created."]);
    }

    public function update(Request $request, Unit $unit): RedirectResponse
    {
        $data = $request->validate([
            'name'         => 'required|string|max:100',
            'abbreviation' => 'required|string|max:20',
            'description'  => 'nullable|string',
        ]);
        $this->unitService->updateUnit($unit, $data);
        return back()->with(['success' => true, 'status' => "Unit updated."]);
    }

    public function destroy(Unit $unit): RedirectResponse
    {
        $name = $unit->name;
        $this->unitService->deleteUnit($unit);
        return back()->with(['success' => true, 'status' => "{$name} deleted."]);
    }
}
