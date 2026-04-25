<?php

namespace App\Domains\Monitoring\Models;

use App\Domains\Laboratory\Models\Section;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MonitoringNode extends Model
{
    protected $fillable = [
        'node_id', 'section_id', 'notes',
        'name', 'model', 'info', 'onlined', 'signal_level', 'battery_level',
    ];

    protected $casts = [
        'info'    => 'array',
        'onlined' => 'boolean',
    ];

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }
}
