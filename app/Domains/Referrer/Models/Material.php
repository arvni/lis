<?php

namespace App\Domains\Referrer\Models;

use App\Domains\Laboratory\Models\SampleType;
use App\Domains\Reception\Models\Sample;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;

class Material extends Model
{
    use Searchable;

    protected $searchable = ['barcode', 'tube_barcode', 'packing_series', 'tube_series'];
    protected $fillable = [
        "sample_type_id",
        "order_material_id",
        "sample_id",
        "packing_series",
        "tube_series",
        "barcode",
        "tube_barcode",
        "expire_date",
        "manufactured_date",
        "assigned_at",
    ];

    protected $casts = [
        "expire_date" => "date:Y-m-d",
        "manufactured_date" => "date:Y-m-d",
    ];

    /** @return BelongsTo<SampleType, $this> */
    public function sampleType(): BelongsTo
    {
        return $this->belongsTo(SampleType::class);
    }

    /** @return BelongsTo<OrderMaterial, $this> */
    public function orderMaterial(): BelongsTo
    {
        return $this->belongsTo(OrderMaterial::class);
    }

    /** @return HasOneThrough<Referrer, OrderMaterial, $this> */
    public function referrer(): HasOneThrough
    {
        return $this->hasOneThrough(Referrer::class, OrderMaterial::class, "id", "id", "order_material_id", "referrer_id");
    }

    public function sample()
    {
        $this->hasOne(Sample::class);
    }


}
