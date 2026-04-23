<?php

namespace App\Domains\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseRequestReceipt extends Model
{
    protected $fillable = ['purchase_request_id', 'transaction_id', 'notes'];

    public function purchaseRequest(): BelongsTo
    {
        return $this->belongsTo(PurchaseRequest::class);
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(StockTransaction::class, 'transaction_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(PurchaseRequestReceiptLine::class, 'receipt_id');
    }
}
