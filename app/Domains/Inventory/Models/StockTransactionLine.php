<?php

namespace App\Domains\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $transaction_id
 * @property int $item_id
 * @property int $unit_id
 * @property numeric $quantity
 * @property numeric $quantity_base_units
 * @property string|null $lot_number
 * @property string|null $brand
 * @property string|null $barcode
 * @property \Illuminate\Support\Carbon|null $expiry_date
 * @property int|null $store_location_id
 * @property numeric|null $unit_price
 * @property numeric|null $total_price
 * @property string|null $notes
 * @property string|null $cat_no
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class StockTransactionLine extends Model
{
    protected $fillable = [
        'transaction_id', 'item_id', 'unit_id', 'quantity', 'quantity_base_units',
        'lot_number', 'brand', 'cat_no', 'barcode', 'expiry_date', 'store_location_id',
        'unit_price', 'total_price', 'notes',
    ];

    protected $casts = [
        'quantity'            => 'decimal:6',
        'quantity_base_units' => 'decimal:6',
        'unit_price'          => 'decimal:4',
        'total_price'         => 'decimal:4',
        'expiry_date'         => 'date:Y-m-d',
    ];

    /** @return BelongsTo<StockTransaction, $this> */
    public function transaction(): BelongsTo
    {
        return $this->belongsTo(StockTransaction::class);
    }

    /** @return BelongsTo<Item, $this> */
    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    /** @return BelongsTo<Unit, $this> */
    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    /** @return BelongsTo<StoreLocation, $this> */
    public function location(): BelongsTo
    {
        return $this->belongsTo(StoreLocation::class, 'store_location_id');
    }
}
