<?php

namespace App\Domains\Inventory\Models;

use App\Domains\Inventory\Enums\ReorderAlertStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $item_id
 * @property int $store_id
 * @property numeric $current_qty_base
 * @property numeric $minimum_stock_level
 * @property \App\Domains\Inventory\Enums\ReorderAlertStatus $status
 * @property \Illuminate\Support\Carbon|null $resolved_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class ReorderAlert extends Model
{
    protected $fillable = [
        'item_id', 'store_id', 'current_qty_base',
        'minimum_stock_level', 'status', 'resolved_at',
    ];

    protected $casts = [
        'status'               => ReorderAlertStatus::class,
        'current_qty_base'     => 'decimal:6',
        'minimum_stock_level'  => 'decimal:6',
        'resolved_at'          => 'datetime',
    ];

    /** @return BelongsTo<Item, $this> */
    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    /** @return BelongsTo<Store, $this> */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function scopeOpen($query)
    {
        return $query->where('status', ReorderAlertStatus::OPEN->value);
    }
}
