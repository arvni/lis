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

    /** @return BelongsTo<PurchaseRequest, $this> */
    public function purchaseRequest(): BelongsTo
    {
        return $this->belongsTo(PurchaseRequest::class);
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

    /** @return BelongsTo<Supplier, $this> */
    public function preferredSupplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'preferred_supplier_id');
    }
}
