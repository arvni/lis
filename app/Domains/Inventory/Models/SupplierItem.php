<?php

namespace App\Domains\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }
}
