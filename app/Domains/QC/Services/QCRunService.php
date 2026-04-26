<?php

namespace App\Domains\QC\Services;

use App\Domains\QC\Models\QCRun;
use App\Domains\QC\Models\QCTarget;

class QCRunService
{
    public function __construct(private readonly WestgardService $westgard)
    {
    }

    public function submitRun(QCTarget $target, float $value, string $runAt, ?string $notes): QCRun
    {
        // Fetch last 10 runs for Westgard context (newest first, excluding current)
        $recent = $target->runs()
            ->orderByDesc('run_at')
            ->limit(10)
            ->pluck('value')
            ->toArray();

        $result = $this->westgard->evaluate($value, $target->mean, $target->sd, $recent);

        return QCRun::create([
            'qc_target_id' => $target->id,
            'analyst_id'   => auth()->id(),
            'value'        => $value,
            'run_at'       => $runAt,
            'status'       => $result['status'],
            'violations'   => $result['violations'],
            'notes'        => $notes,
        ]);
    }
}
