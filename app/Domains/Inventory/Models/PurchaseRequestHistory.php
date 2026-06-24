<?php

namespace App\Domains\Inventory\Models;

use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $purchase_request_id
 * @property int $user_id
 * @property string $event
 * @property string|null $notes
 * @property string|null $change_notes
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class PurchaseRequestHistory extends Model
{
    protected $fillable = ['purchase_request_id', 'user_id', 'event', 'notes', 'change_notes'];

    /** @return BelongsTo<PurchaseRequest, $this> */
    public function purchaseRequest(): BelongsTo
    {
        return $this->belongsTo(PurchaseRequest::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
