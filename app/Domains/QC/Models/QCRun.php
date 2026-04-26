<?php

namespace App\Domains\QC\Models;

use App\Domains\QC\Enums\QCStatus;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QCRun extends Model
{
    protected $table = 'qc_runs';

    protected $fillable = [
        'qc_target_id', 'analyst_id', 'value', 'run_at', 'status', 'violations', 'notes',
    ];

    protected $casts = [
        'value'      => 'float',
        'run_at'     => 'datetime',
        'status'     => QCStatus::class,
        'violations' => 'array',
    ];

    public function target(): BelongsTo
    {
        return $this->belongsTo(QCTarget::class, 'qc_target_id');
    }

    public function analyst(): BelongsTo
    {
        return $this->belongsTo(User::class, 'analyst_id');
    }

    // z-score relative to target
    public function zScore(): float
    {
        $t = $this->target;
        return $t && $t->sd > 0 ? round(($this->value - $t->mean) / $t->sd, 3) : 0;
    }
}
