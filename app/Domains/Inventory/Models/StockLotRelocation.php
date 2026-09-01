<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Models;

use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * An audit row for stock that changed place without changing quantity.
 *
 * @property-read StockLot|null $lot
 * @property-read StockLot|null $destinationLot
 * @property-read Item|null $item
 * @property-read Store|null $fromStore
 * @property-read Store|null $toStore
 * @property-read StoreLocation|null $fromLocation
 * @property-read StoreLocation|null $toLocation
 * @property-read User|null $user
 * @property int $id
 * @property int $stock_lot_id
 * @property int|null $destination_lot_id
 * @property int $item_id
 * @property numeric $quantity_base_units
 * @property int $from_store_id
 * @property int|null $from_store_location_id
 * @property int $to_store_id
 * @property int|null $to_store_location_id
 * @property int $user_id
 * @property string|null $notes
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class StockLotRelocation extends Model
{
    protected $fillable = [
        'stock_lot_id', 'destination_lot_id', 'item_id', 'quantity_base_units',
        'from_store_id', 'from_store_location_id', 'to_store_id', 'to_store_location_id',
        'user_id', 'notes',
    ];

    protected $casts = [
        'quantity_base_units' => 'decimal:6',
    ];

    /** @return BelongsTo<StockLot, $this> */
    public function lot(): BelongsTo
    {
        return $this->belongsTo(StockLot::class, 'stock_lot_id');
    }

    /** @return BelongsTo<StockLot, $this> */
    public function destinationLot(): BelongsTo
    {
        return $this->belongsTo(StockLot::class, 'destination_lot_id');
    }

    /** @return BelongsTo<Item, $this> */
    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    /** @return BelongsTo<Store, $this> */
    public function fromStore(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'from_store_id');
    }

    /** @return BelongsTo<Store, $this> */
    public function toStore(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'to_store_id');
    }

    /** @return BelongsTo<StoreLocation, $this> */
    public function fromLocation(): BelongsTo
    {
        return $this->belongsTo(StoreLocation::class, 'from_store_location_id');
    }

    /** @return BelongsTo<StoreLocation, $this> */
    public function toLocation(): BelongsTo
    {
        return $this->belongsTo(StoreLocation::class, 'to_store_location_id');
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
