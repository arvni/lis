<?php

namespace App\Domains\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StoreLocation extends Model
{
    protected $fillable = [
        'store_id', 'zone', 'row', 'column', 'shelf', 'bin',
        'label', 'capacity_notes', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

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

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
