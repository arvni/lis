<?php

namespace App\Domains\Monitoring\Models;

use App\Domains\Laboratory\Models\Section;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MonitoringNode extends Model
{
    protected $fillable = ['node_id', 'section_id', 'notes'];

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }
}
