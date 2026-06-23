<?php

namespace App\Domains\Laboratory\Models;


use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SampleTypeTest extends Pivot
{
    protected $table="sample_type_tests";
    protected $fillable = [
        "description",
        "defaultType"
    ];
    protected $casts = [
        "defaultType" => "boolean"
    ];

    /** @return BelongsTo<SampleType, $this> */
    public function sampleType(): BelongsTo
    {
        return $this->belongsTo(SampleType::class);
    }

    /** @return BelongsTo<Test, $this> */
    public function test(): BelongsTo
    {
        return $this->belongsTo(Test::class);
    }
}
