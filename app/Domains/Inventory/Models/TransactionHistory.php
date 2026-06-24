<?php

namespace App\Domains\Inventory\Models;

use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $transaction_id
 * @property int $user_id
 * @property string $event
 * @property string|null $notes
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class TransactionHistory extends Model
{
    protected $fillable = ['transaction_id', 'user_id', 'event', 'notes'];

    /** @return BelongsTo<StockTransaction, $this> */
    public function transaction(): BelongsTo
    {
        return $this->belongsTo(StockTransaction::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
