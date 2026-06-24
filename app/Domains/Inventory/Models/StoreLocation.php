<?php

namespace App\Domains\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

/**
 * @property int $id
 * @property int $store_id
 * @property string|null $zone
 * @property string|null $row
 * @property string|null $column
 * @property string|null $shelf
 * @property string|null $bin
 * @property string $label
 * @property string|null $capacity_notes
 * @property bool $is_active
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class StoreLocation extends Model
{
    protected $fillable = [
        'store_id', 'zone', 'row', 'column', 'shelf', 'bin',
        'label', 'capacity_notes', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /** @return BelongsTo<Store, $this> */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    /** @return HasMany<StockLot, $this> */
    public function lots(): HasMany
    {
        return $this->hasMany(StockLot::class);
    }

    public static function generateLabel(?string $zone, ?string $row, ?string $column, ?string $shelf, ?string $bin): string
    {
        return collect([$zone, $row, $column, $shelf, $bin])
            ->filter()
            ->implode('-');
    }

    /**
     * @param  Builder<StoreLocation>  $query
     * @return Builder<StoreLocation>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
