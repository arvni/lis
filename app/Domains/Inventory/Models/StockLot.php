<?php

namespace App\Domains\Inventory\Models;

use App\Domains\Inventory\Enums\LotStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

/**
 * @property-read Item|null $item
 * @property-read Store|null $store
 * @property-read StoreLocation|null $location
 * @property-read \Illuminate\Database\Eloquent\Collection<int, StockTransactionLine> $transactionLines
 * @property int $id
 * @property int $item_id
 * @property string $lot_number
 * @property string|null $brand
 * @property string|null $barcode
 * @property \Illuminate\Support\Carbon|null $expiry_date
 * @property \Illuminate\Support\Carbon|null $manufacture_date
 * @property \Illuminate\Support\Carbon $received_date
 * @property numeric $quantity_base_units
 * @property numeric $unit_price_base
 * @property int $store_id
 * @property int|null $store_location_id
 * @property \App\Domains\Inventory\Enums\LotStatus $status
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
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
    public function scopeActiveFifo(Builder $query): Builder
    {
        return $query->where('status', LotStatus::ACTIVE->value)
            ->where('quantity_base_units', '>', 0)
            ->orderBy('received_date', 'asc')
            ->orderBy('id', 'asc');
    }

    /**
     * Statuses that mean the stock is physically sitting on the shelf: usable
     * lots plus expired ones, which are still on hand until they are removed
     * or returned.
     *
     * @return array<int, string>
     */
    public static function onHandStatuses(): array
    {
        return [LotStatus::ACTIVE->value, LotStatus::EXPIRED->value];
    }

    /**
     * @param  Builder<StockLot>  $query
     * @return Builder<StockLot>
     */
    public function scopeOnHand(Builder $query): Builder
    {
        return $query->whereIn('status', self::onHandStatuses());
    }

    /**
     * Lots that are no longer usable — flagged EXPIRED by the nightly sweep, or
     * still ACTIVE but already past their date because the sweep has not run.
     *
     * @param  Builder<StockLot>  $query
     * @return Builder<StockLot>
     */
    public function scopeExpired(Builder $query): Builder
    {
        return $query->where(fn (Builder $q) => $q
            ->where('status', LotStatus::EXPIRED->value)
            ->orWhere(fn (Builder $q2) => $q2
                ->where('status', LotStatus::ACTIVE->value)
                ->whereNotNull('expiry_date')
                ->whereDate('expiry_date', '<', now())
            )
        );
    }

    /**
     * Usable stock: active lots that have not passed their expiry date.
     *
     * @param  Builder<StockLot>  $query
     * @return Builder<StockLot>
     */
    public function scopeUsable(Builder $query): Builder
    {
        return $query->where('status', LotStatus::ACTIVE->value)
            ->where(fn (Builder $q) => $q
                ->whereNull('expiry_date')
                ->orWhereDate('expiry_date', '>=', now())
            );
    }

    /** Past its expiry date, or already flagged as expired. */
    public function isExpired(): bool
    {
        return $this->status === LotStatus::EXPIRED
            || ($this->expiry_date !== null && $this->expiry_date->isBefore(now()->startOfDay()));
    }

    /**
     * @param  Builder<StockLot>  $query
     * @return Builder<StockLot>
     */
    public function scopeExpiringSoon(Builder $query, int $days = 30): Builder
    {
        return $query->where('status', LotStatus::ACTIVE->value)
            ->whereNotNull('expiry_date')
            ->whereDate('expiry_date', '<=', now()->addDays($days))
            ->whereDate('expiry_date', '>', now());
    }
}
