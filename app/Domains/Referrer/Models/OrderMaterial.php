<?php

namespace App\Domains\Referrer\Models;

use App\Domains\Laboratory\Models\SampleType;
use App\Domains\Referrer\Enums\OrderMaterialStatus;
use Illuminate\Database\Eloquent\Model;

class OrderMaterial extends Model
{
    protected $fillable = [
        "amount",
        "server_id",
        "status",
    ];

    protected $casts = [
        "status" => OrderMaterialStatus::class
    ];

    public function referrer()
    {
        return $this->belongsTo(Referrer::class);
    }

    public function sampleType()
    {
        return $this->belongsTo(SampleType::class);
    }

    public function materials()
    {
        return $this->hasMany(Material::class);
    }
}
