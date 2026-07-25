<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $stock_export_request_id
 * @property int $item_id
 * @property int $unit_id
 * @property numeric $qty
 * @property numeric $qty_fulfilled
 * @property string|null $notes
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class StockExportRequestLine extends Model
{
    protected $fillable = [
        'stock_export_request_id', 'item_id', 'unit_id', 'qty', 'qty_fulfilled', 'notes',
    ];

    protected $casts = [
        'qty' => 'decimal:6',
        'qty_fulfilled' => 'decimal:6',
    ];

    /** @return BelongsTo<StockExportRequest, $this> */
    public function stockExportRequest(): BelongsTo
    {
        return $this->belongsTo(StockExportRequest::class);
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
}
