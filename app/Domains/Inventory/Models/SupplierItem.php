<?php

namespace App\Domains\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $supplier_id
 * @property int $item_id
 * @property string|null $supplier_item_code
 * @property string|null $supplier_item_name
 * @property numeric|null $last_purchase_price
 * @property string|null $currency
 * @property numeric|null $min_order_qty
 * @property int|null $unit_id
 * @property int|null $lead_time_days
 * @property bool $is_preferred
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class SupplierItem extends Model
{
    protected $fillable = [
        'supplier_id', 'item_id', 'supplier_item_code', 'supplier_item_name',
        'last_purchase_price', 'currency', 'min_order_qty', 'unit_id',
        'lead_time_days', 'is_preferred',
    ];

    protected $casts = [
        'is_preferred'        => 'boolean',
        'last_purchase_price' => 'decimal:4',
        'min_order_qty'       => 'decimal:6',
    ];

    /** @return BelongsTo<Supplier, $this> */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
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
}
