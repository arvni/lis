<?php

namespace App\Http\Controllers\QC;

use App\Domains\QC\Models\QCMaterial;
use App\Domains\QC\Models\QCTarget;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class QCTargetController extends Controller
{
    public function index(QCMaterial $qcMaterial)
    {
        Gate::authorize('QC.Materials.List Materials');

        $qcMaterial->load([
            'section:id,name',
            'targets.methodTest.test:id,name',
            'targets.methodTest.method:id,name',
        ]);

        return Inertia::render('QC/Targets/Index', [
            'material' => $qcMaterial,
        ]);
    }

    public function store(Request $request, QCMaterial $qcMaterial)
    {
        Gate::authorize('QC.Materials.Edit Material');

        $data = $request->validate([
            'method_test_id' => 'required|exists:method_tests,id',
            'mean'           => 'required|numeric',
            'sd'             => 'required|numeric|min:0.0001',
            'unit'           => 'nullable|string|max:50',
        ]);

        $qcMaterial->targets()->updateOrCreate(
            ['method_test_id' => $data['method_test_id']],
            ['mean' => $data['mean'], 'sd' => $data['sd'], 'unit' => $data['unit'] ?? null]
        );

        return redirect()->back()->with('success', 'Target saved.');
    }

    public function destroy(QCMaterial $qcMaterial, QCTarget $qcTarget)
    {
        Gate::authorize('QC.Materials.Edit Material');
        $qcTarget->delete();
        return redirect()->back()->with('success', 'Target removed.');
    }
}
