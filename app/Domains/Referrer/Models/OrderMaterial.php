<?php

namespace App\Domains\Referrer\Models;

use App\Domains\Laboratory\Models\SampleType;
use App\Domains\Referrer\Enums\OrderMaterialStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $referrer_id
 * @property int $sample_type_id
 * @property int $server_id
 * @property int $amount
 * @property \App\Domains\Referrer\Enums\OrderMaterialStatus $status
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read string|null $sample_type_name query-derived alias (joined sample type name)
 * @property-read string|null $referrer_fullname query-derived alias (joined referrer full name)
 */
class OrderMaterial extends Model
{
    protected $fillable = [
        "referrer_id",
        "sample_type_id",
        "amount",
        "server_id",
        "status",
    ];

    protected $casts = [
        "status" => OrderMaterialStatus::class
    ];

    /** @return BelongsTo<Referrer, $this> */
    public function referrer(): BelongsTo
    {
        return $this->belongsTo(Referrer::class);
    }

    /** @return BelongsTo<SampleType, $this> */
    public function sampleType(): BelongsTo
    {
        return $this->belongsTo(SampleType::class);
    }

    /** @return HasMany<Material, $this> */
    public function materials(): HasMany
    {
        return $this->hasMany(Material::class);
    }
}
