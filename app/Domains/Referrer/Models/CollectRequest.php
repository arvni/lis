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
        "barcode",
        "logistic_information",
        "preferred_date",
        "note",
    ];

    protected $casts = [
        "status"               => CollectRequestStatus::class,
        "logistic_information" => "json",
        "preferred_date"       => "datetime",
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
