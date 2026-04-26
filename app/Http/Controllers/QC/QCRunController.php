<?php

namespace App\Http\Controllers\QC;

use App\Domains\QC\Models\QCRun;
use App\Domains\QC\Models\QCTarget;
use App\Domains\QC\Services\QCRunService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class QCRunController extends Controller
{
    public function __construct(private readonly QCRunService $runService)
    {
    }

    public function index(Request $request)
    {
        Gate::authorize('QC.Runs.List Runs');

        $targetId = $request->get('target_id');

        $query = QCRun::with([
            'target.material',
            'target.methodTest.test:id,name',
            'analyst:id,name',
        ])->orderByDesc('run_at');

        if ($targetId) {
            $query->where('qc_target_id', $targetId);
        }

        // Pass last 30 runs for the Levey-Jennings chart
        $runs = $query->limit(60)->get();

        // All targets for the filter selector
        $targets = QCTarget::with([
            'material:id,name,level',
            'methodTest.test:id,name',
        ])->get();

        return Inertia::render('QC/Runs/Index', [
            'runs'      => $runs,
            'targets'   => $targets,
            'target_id' => $targetId ? (int) $targetId : null,
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('QC.Runs.Create Run');

        $data = $request->validate([
            'qc_target_id' => 'required|exists:qc_targets,id',
            'value'        => 'required|numeric',
            'run_at'       => 'required|date',
            'notes'        => 'nullable|string',
        ]);

        $target = QCTarget::findOrFail($data['qc_target_id']);
        $run = $this->runService->submitRun(
            $target,
            (float) $data['value'],
            $data['run_at'],
            $data['notes'] ?? null
        );

        return redirect()->back()->with([
            'success' => true,
            'status'  => match($run->status->value) {
                'pass'    => 'QC run passed.',
                'warning' => 'QC run: warning — ' . implode(', ', $run->violations ?? []),
                'fail'    => 'QC run FAILED — ' . implode(', ', $run->violations ?? []),
            },
        ]);
    }
}
