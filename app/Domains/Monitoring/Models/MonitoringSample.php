<?php

namespace App\Domains\Monitoring\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MonitoringSample extends Model
{
    protected $fillable = ['node_id', 'sampled_at', 'temperature', 'humidity'];

    protected $casts = [
        'sampled_at'  => 'datetime',
        'temperature' => 'decimal:2',
        'humidity'    => 'decimal:2',
    ];

    public function monitoringNode(): BelongsTo
    {
        return $this->belongsTo(MonitoringNode::class, 'node_id', 'node_id');
    }
}
