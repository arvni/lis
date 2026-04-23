<?php

namespace App\Domains\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(StockTransaction::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(StoreLocation::class, 'store_location_id');
    }
}
