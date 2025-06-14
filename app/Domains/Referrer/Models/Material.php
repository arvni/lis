<?php

namespace App\Domains\Referrer\Models;

use App\Domains\Laboratory\Models\SampleType;
use App\Domains\Reception\Models\Sample;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;

class Material extends Model
{
    use Searchable;

    protected $searchable = ['barcode', 'tube_barcode', 'packing_series'];
    protected $fillable = [
        "sample_type_id",
        "order_material_id",
        "sample_id",
        "packing_series",
        "barcode",
        "tube_barcode",
        "expire_date",
        "assigned_at",
    ];

    protected $casts = [
        "expire_date" => "date:Y-m-d",
    ];

    public function sampleType()
    {
        return $this->belongsTo(SampleType::class);
    }

    public function orderMaterial()
    {
        return $this->belongsTo(OrderMaterial::class);
    }

    public function referrer()
    {
        return $this->hasOneThrough(Referrer::class, OrderMaterial::class, "id", "id", "order_material_id", "referrer_id");
    }

    public function sample()
    {
        $this->hasOne(Sample::class);
    }


}
