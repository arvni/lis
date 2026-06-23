<?php

namespace App\Domains\Laboratory\Models;

use App\Domains\Reception\Models\AcceptanceItem;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MethodTest extends Model
{

    protected $fillable = [
        "method_id",
        "test_id",
        "is_default",
        "status"
    ];

    protected $casts = [
        "status" => "boolean",
        "is_default" => "boolean"
    ];

    /** @return BelongsTo<Method, $this> */
    public function method(): BelongsTo
    {
        return $this->belongsTo(Method::class);
    }

    /** @return BelongsTo<Test, $this> */
    public function test(): BelongsTo
    {
        return $this->belongsTo(Test::class);
    }

    /** @return HasMany<AcceptanceItem, $this> */
    public function acceptanceItems(): HasMany
    {
        return $this->hasMany(AcceptanceItem::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', true);
    }

}
