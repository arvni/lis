<?php

namespace App\Domains\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseRequestReceipt extends Model
{
    protected $fillable = ['purchase_request_id', 'transaction_id', 'notes'];

    /** @return BelongsTo<PurchaseRequest, $this> */
    public function purchaseRequest(): BelongsTo
    {
        return $this->belongsTo(PurchaseRequest::class);
    }

    /** @return BelongsTo<StockTransaction, $this> */
    public function transaction(): BelongsTo
    {
        return $this->belongsTo(StockTransaction::class, 'transaction_id');
    }

    /** @return HasMany<PurchaseRequestReceiptLine, $this> */
    public function lines(): HasMany
    {
        return $this->hasMany(PurchaseRequestReceiptLine::class, 'receipt_id');
    }
}
