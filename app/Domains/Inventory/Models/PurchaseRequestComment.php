<?php

namespace App\Domains\Inventory\Models;

use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseRequestComment extends Model
{
    protected $fillable = ['purchase_request_id', 'user_id', 'body'];

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
