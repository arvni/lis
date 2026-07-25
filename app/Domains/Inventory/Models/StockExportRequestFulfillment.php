<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $stock_export_request_id
 * @property int $transaction_id
 * @property string|null $notes
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class StockExportRequestFulfillment extends Model
{
    protected $fillable = ['stock_export_request_id', 'transaction_id', 'notes'];

    /** @return BelongsTo<StockExportRequest, $this> */
    public function stockExportRequest(): BelongsTo
    {
        return $this->belongsTo(StockExportRequest::class);
    }

    /** @return BelongsTo<StockTransaction, $this> */
    public function transaction(): BelongsTo
    {
        return $this->belongsTo(StockTransaction::class, 'transaction_id');
    }

    /** @return HasMany<StockExportRequestFulfillmentLine, $this> */
    public function lines(): HasMany
    {
        return $this->hasMany(StockExportRequestFulfillmentLine::class, 'fulfillment_id');
    }
}
