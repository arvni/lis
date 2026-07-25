<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Models;

use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $stock_export_request_id
 * @property int $user_id
 * @property string $event
 * @property string|null $notes
 * @property string|null $change_notes
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class StockExportRequestHistory extends Model
{
    protected $fillable = ['stock_export_request_id', 'user_id', 'event', 'notes', 'change_notes'];

    /** @return BelongsTo<StockExportRequest, $this> */
    public function stockExportRequest(): BelongsTo
    {
        return $this->belongsTo(StockExportRequest::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
