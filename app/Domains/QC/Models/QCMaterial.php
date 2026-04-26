<?php

namespace App\Domains\QC\Models;

use App\Domains\Laboratory\Models\Section;
use App\Domains\QC\Enums\QCLevel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class QCMaterial extends Model
{
    use SoftDeletes;

    protected $table = 'qc_materials';

    protected $fillable = [
        'name', 'level', 'lot_number', 'expiry_date', 'section_id', 'notes',
    ];

    protected $casts = [
        'level'       => QCLevel::class,
        'expiry_date' => 'date',
    ];

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    public function targets(): HasMany
    {
        return $this->hasMany(QCTarget::class, 'qc_material_id');
    }
}
