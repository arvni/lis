<?php

namespace App\Domains\Monitoring\Models;

use Carbon\Carbon;
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

    // MySQL TIMESTAMP columns store UTC. Carbon 3's createFromFormat() defaults to PHP's
    // local timezone (Asia/Muscat) rather than UTC, so we must parse explicitly as UTC.
    protected function asDateTime($value): Carbon
    {
        if (is_string($value) && !$this->isStandardDateFormat($value)) {
            try {
                return Carbon::createFromFormat($this->getDateFormat(), $value, 'UTC');
            } catch (\InvalidArgumentException) {}
        }
        return parent::asDateTime($value);
    }

    public function monitoringNode(): BelongsTo
    {
        return $this->belongsTo(MonitoringNode::class, 'node_id', 'node_id');
    }
}
