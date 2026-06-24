<?php

namespace App\Domains\Laboratory\Models;

use App\Domains\Reception\Models\AcceptanceItem;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

/**
 * @property int $id
 * @property int|null $method_id
 * @property int|null $test_id
 * @property bool $is_default
 * @property bool $status
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
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

    /**
     * @param  Builder<MethodTest>  $query
     * @return Builder<MethodTest>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', true);
    }

}
