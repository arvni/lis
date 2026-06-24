<?php

namespace App\Domains\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $receipt_id
 * @property int $pr_line_id
 * @property numeric $qty_received
 * @property numeric|null $unit_price
 * @property string|null $lot_number
 * @property string|null $brand
 * @property string|null $cat_no
 * @property \Illuminate\Support\Carbon|null $expiry_date
 * @property int|null $store_location_id
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
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

    /** @return BelongsTo<PurchaseRequestReceipt, $this> */
    public function receipt(): BelongsTo
    {
        return $this->belongsTo(PurchaseRequestReceipt::class, 'receipt_id');
    }

    /** @return BelongsTo<PurchaseRequestLine, $this> */
    public function prLine(): BelongsTo
    {
        return $this->belongsTo(PurchaseRequestLine::class, 'pr_line_id');
    }

    /** @return BelongsTo<StoreLocation, $this> */
    public function location(): BelongsTo
    {
        return $this->belongsTo(StoreLocation::class, 'store_location_id');
    }
}
