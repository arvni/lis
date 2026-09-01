<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Models;

use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * A record of stock being re-derived from the transaction ledger, kept so a
 * correction can always be traced back to who ran it and what it changed.
 *
 * @property-read Item|null $item
 * @property-read Store|null $store
 * @property-read User|null $user
 * @property int $id
 * @property int $item_id
 * @property int $store_id
 * @property numeric $previous_base_units
 * @property numeric $expected_base_units
 * @property numeric $difference_base_units
 * @property int $user_id
 * @property string|null $notes
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class StockReconciliation extends Model
{
    protected $fillable = [
        'item_id', 'store_id', 'previous_base_units', 'expected_base_units',
        'difference_base_units', 'user_id', 'notes',
    ];

    protected $casts = [
        'previous_base_units' => 'decimal:6',
        'expected_base_units' => 'decimal:6',
        'difference_base_units' => 'decimal:6',
    ];

    /** @return BelongsTo<Item, $this> */
    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    /** @return BelongsTo<Store, $this> */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
