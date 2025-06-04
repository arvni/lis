<?php

namespace App\Domains\Laboratory\Models;

use App\Domains\Laboratory\Enums\OfferType;
use App\Domains\Reception\Models\Sample;
use App\Domains\Referrer\Models\Referrer;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Material extends Model
{
    use Searchable;

    protected $searchable = ['barcode', 'tube_barcode'];
    protected $fillable = [
        "sample_type_id",
        "referrer_id",
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

    public function referrer()
    {
        return $this->belongsTo(Referrer::class);
    }

    public function sample()
    {
        $this->belongsTo(Sample::class);
    }


}
