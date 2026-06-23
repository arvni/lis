<?php

namespace App\Domains\Reception\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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

    /** @return BelongsTo<Sample, $this> */
    public function sample(): BelongsTo
    {
        return $this->belongsTo(Sample::class);
    }

    /** @return BelongsTo<AcceptanceItem, $this> */
    public function acceptanceItem(): BelongsTo
    {
        return $this->belongsTo(AcceptanceItem::class);
    }
}
