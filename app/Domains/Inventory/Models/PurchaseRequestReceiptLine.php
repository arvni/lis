<?php

namespace App\Domains\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseRequestReceiptLine extends Model
{
    protected $fillable = [
        'receipt_id', 'pr_line_id', 'qty_received', 'unit_price',
        'lot_number', 'brand', 'cat_no', 'expiry_date', 'store_location_id',
    ];

    protected $casts = [
        'qty_received' => 'decimal:6',
        'unit_price'   => 'decimal:4',
        'expiry_date'  => 'date:Y-m-d',
    ];

    public function receipt(): BelongsTo
    {
        return $this->belongsTo(PurchaseRequestReceipt::class, 'receipt_id');
    }

    public function prLine(): BelongsTo
    {
        return $this->belongsTo(PurchaseRequestLine::class, 'pr_line_id');
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(StoreLocation::class, 'store_location_id');
    }
}
