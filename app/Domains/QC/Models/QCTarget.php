<?php

namespace App\Domains\QC\Models;

use App\Domains\Laboratory\Models\MethodTest;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QCTarget extends Model
{
    protected $table = 'qc_targets';

    protected $fillable = [
        'qc_material_id', 'method_test_id', 'mean', 'sd', 'unit',
    ];

    protected $casts = [
        'mean' => 'float',
        'sd'   => 'float',
    ];

    protected $appends = ['cv_percent'];

    public function getCvPercentAttribute(): float
    {
        return $this->sd > 0 && $this->mean != 0
            ? round(($this->sd / abs($this->mean)) * 100, 2)
            : 0;
    }

    public function material(): BelongsTo
    {
        return $this->belongsTo(QCMaterial::class, 'qc_material_id');
    }

    public function methodTest(): BelongsTo
    {
        return $this->belongsTo(MethodTest::class);
    }

    public function runs(): HasMany
    {
        return $this->hasMany(QCRun::class, 'qc_target_id')->latest('run_at');
    }
}
