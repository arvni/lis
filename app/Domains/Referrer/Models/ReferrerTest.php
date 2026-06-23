<?php

namespace App\Domains\Referrer\Models;

use App\Domains\Laboratory\Models\Test;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReferrerTest extends Model
{
    use HasFactory;

    protected $fillable = [
        "referrer_id",
        "test_id",
        "price",
        "methods",
        "price_type",
        "extra"
    ];

    protected $casts = [
        "methods" => "json",
        "extra" => "json",
    ];

    /** @return BelongsTo<Test, $this> */
    public function test(): BelongsTo
    {
        return $this->belongsTo(Test::class);
    }

    /** @return BelongsTo<Referrer, $this> */
    public function referrer(): BelongsTo
    {
        return $this->belongsTo(Referrer::class);
    }
}
