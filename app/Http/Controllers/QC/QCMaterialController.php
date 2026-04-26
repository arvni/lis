<?php

namespace App\Http\Controllers\QC;

use App\Domains\Laboratory\Models\Section;
use App\Domains\QC\Enums\QCLevel;
use App\Domains\QC\Models\QCMaterial;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rules\Enum;
use Inertia\Inertia;

class QCMaterialController extends Controller
{
    public function index()
    {
        Gate::authorize('QC.Materials.List Materials');

        $materials = QCMaterial::with('section:id,name')
            ->withCount('targets')
            ->orderBy('name')
            ->get();

        $sections = Section::orderBy('name')->get(['id', 'name']);

        return Inertia::render('QC/Materials/Index', [
            'materials' => $materials,
            'sections'  => $sections,
            'levels'    => array_map(fn($l) => ['value' => $l->value, 'label' => $l->label()], QCLevel::cases()),
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('QC.Materials.Create Material');

        $data = $request->validate([
            'name'        => 'required|string|max:200',
            'level'       => ['required', new Enum(QCLevel::class)],
            'lot_number'  => 'nullable|string|max:100',
            'expiry_date' => 'nullable|date',
            'section_id'  => 'nullable|exists:sections,id',
            'notes'       => 'nullable|string',
        ]);

        QCMaterial::create($data);
        return redirect()->back()->with('success', 'Material created.');
    }

    public function update(Request $request, QCMaterial $qcMaterial)
    {
        Gate::authorize('QC.Materials.Edit Material');

        $data = $request->validate([
            'name'        => 'required|string|max:200',
            'level'       => ['required', new Enum(QCLevel::class)],
            'lot_number'  => 'nullable|string|max:100',
            'expiry_date' => 'nullable|date',
            'section_id'  => 'nullable|exists:sections,id',
            'notes'       => 'nullable|string',
        ]);

        $qcMaterial->update($data);
        return redirect()->back()->with('success', 'Material updated.');
    }

    public function destroy(QCMaterial $qcMaterial)
    {
        Gate::authorize('QC.Materials.Delete Material');
        $qcMaterial->delete();
        return redirect()->back()->with('success', 'Material deleted.');
    }
}
