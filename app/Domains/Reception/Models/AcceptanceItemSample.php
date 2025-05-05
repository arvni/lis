<?php

namespace App\Domains\Reception\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\Pivot;

class AcceptanceItemSample extends Pivot
{
    protected $table="acceptance_item_samples";
    protected $fillable=[
        "acceptance_item_id",
        "sample_id",
        "active"
    ];

    public $timestamps=false;
    protected $casts=[
        "active"=>"boolean"
    ];

    public function sample()
    {
        return $this->belongsTo(Sample::class);
    }

    public function acceptanceItem()
    {
        return $this->belongsTo(AcceptanceItem::class);
    }
}
