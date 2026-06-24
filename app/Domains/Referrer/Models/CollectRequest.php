<?php

namespace App\Domains\Referrer\Models;

use App\Domains\Reception\Models\Sample;
use App\Domains\Referrer\Enums\CollectRequestStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int|null $sample_collector_id
 * @property int $referrer_id
 * @property \App\Domains\Referrer\Enums\CollectRequestStatus $status
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property string|null $barcode
 * @property array<array-key, mixed>|null $logistic_information
 * @property \Illuminate\Support\Carbon|null $preferred_date
 * @property string|null $note
 */
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

    /** @return BelongsTo<SampleCollector, $this> */
    public function sampleCollector(): BelongsTo
    {
        return $this->belongsTo(SampleCollector::class);
    }

    /** @return BelongsTo<Referrer, $this> */
    public function referrer(): BelongsTo
    {
        return $this->belongsTo(Referrer::class);
    }

    /** @return HasMany<ReferrerOrder, $this> */
    public function referrerOrders(): HasMany
    {
        return $this->hasMany(ReferrerOrder::class);
    }

    /** @return HasMany<Sample, $this> */
    public function samples(): HasMany
    {
        return $this->hasMany(Sample::class);
    }
}
