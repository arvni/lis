<?php

namespace App\Domains\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $purchase_request_id
 * @property int $transaction_id
 * @property string|null $notes
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
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
