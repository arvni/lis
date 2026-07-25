<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $fulfillment_id
 * @property int $export_line_id
 * @property numeric $qty_fulfilled
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class StockExportRequestFulfillmentLine extends Model
{
    protected $fillable = ['fulfillment_id', 'export_line_id', 'qty_fulfilled'];

    protected $casts = [
        'qty_fulfilled' => 'decimal:6',
    ];

    /** @return BelongsTo<StockExportRequestFulfillment, $this> */
    public function fulfillment(): BelongsTo
    {
        return $this->belongsTo(StockExportRequestFulfillment::class, 'fulfillment_id');
    }

    /** @return BelongsTo<StockExportRequestLine, $this> */
    public function exportLine(): BelongsTo
    {
        return $this->belongsTo(StockExportRequestLine::class, 'export_line_id');
    }
}
