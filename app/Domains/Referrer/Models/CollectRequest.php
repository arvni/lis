<?php

namespace App\Domains\Referrer\Models;

use App\Domains\Referrer\Enums\CollectRequestStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CollectRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        "sample_collector_id",
        "referrer_id",
        "status",
        "logistic_information",
    ];

    protected $casts = [
        "status" => CollectRequestStatus::class,
        "logistic_information" => "json",
    ];

    public function sampleCollector(): BelongsTo
    {
        return $this->belongsTo(SampleCollector::class);
    }

    public function referrer(): BelongsTo
    {
        return $this->belongsTo(Referrer::class);
    }

    public function referrerOrders(): HasMany
    {
        return $this->hasMany(ReferrerOrder::class);
    }
}
