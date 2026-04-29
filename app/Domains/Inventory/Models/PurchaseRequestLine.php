<?php

namespace App\Domains\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseRequestLine extends Model
{
    protected $fillable = [
        'purchase_request_id', 'item_id', 'unit_id', 'qty', 'estimated_unit_price',
        'preferred_supplier_id', 'notes', 'cat_no', 'brand', 'unit_price', 'qty_received',
    ];

    protected $casts = [
        'qty'                  => 'decimal:6',
        'qty_received'         => 'decimal:6',
        'unit_price'           => 'decimal:4',
        'estimated_unit_price' => 'decimal:4',
    ];

    public function purchaseRequest(): BelongsTo
    {
        return $this->belongsTo(PurchaseRequest::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function preferredSupplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'preferred_supplier_id');
    }
}
