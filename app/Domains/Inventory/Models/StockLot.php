<?php

namespace App\Domains\Inventory\Models;

use App\Domains\Inventory\Enums\LotStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property-read Item|null $item
 * @property-read Store|null $store
 * @property-read StoreLocation|null $location
 * @property-read \Illuminate\Database\Eloquent\Collection<int, StockTransactionLine> $transactionLines
 */
class StockLot extends Model
{
    protected $fillable = [
        'item_id', 'lot_number', 'brand', 'barcode', 'expiry_date', 'manufacture_date',
        'received_date', 'quantity_base_units', 'unit_price_base',
        'store_id', 'store_location_id', 'status',
    ];

    protected $casts = [
        'status'              => LotStatus::class,
        'expiry_date'         => 'date:Y-m-d',
        'manufacture_date'    => 'date:Y-m-d',
        'received_date'       => 'date:Y-m-d',
        'quantity_base_units' => 'decimal:6',
        'unit_price_base'     => 'decimal:4',
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

    /** @return BelongsTo<StoreLocation, $this> */
    public function location(): BelongsTo
    {
        return $this->belongsTo(StoreLocation::class, 'store_location_id');
    }

    /** @return HasMany<StockTransactionLine, $this> */
    public function transactionLines(): HasMany
    {
        return $this->hasMany(StockTransactionLine::class, 'lot_number', 'lot_number')
            ->where('item_id', $this->item_id);
    }

    /** FIFO scope: oldest received lots first, active only */
    public function scopeActiveFifo($query)
    {
        return $query->where('status', LotStatus::ACTIVE->value)
            ->where('quantity_base_units', '>', 0)
            ->orderBy('received_date', 'asc')
            ->orderBy('id', 'asc');
    }

    public function scopeExpiringSoon($query, int $days = 30)
    {
        return $query->where('status', LotStatus::ACTIVE->value)
            ->whereNotNull('expiry_date')
            ->whereDate('expiry_date', '<=', now()->addDays($days))
            ->whereDate('expiry_date', '>', now());
    }
}
