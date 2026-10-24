<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Models;

use App\Domains\PreOrder\Enums\FinanceStatus;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * A finance record: the quotation the center approves. Its lines are pre_order_items rows.
 *
 * @property int $id
 * @property int $pre_order_id
 * @property int|null $request_id
 * @property string $number
 * @property list<string> $reasons
 * @property string|null $reason
 * @property FinanceStatus $status
 * @property numeric $subtotal
 * @property numeric $discount
 * @property numeric $total
 * @property numeric|null $approved_amount
 * @property Carbon|null $expires_at
 * @property int|null $created_by
 * @property string|null $decided_by
 * @property Carbon|null $decided_at
 * @property string|null $note
 * @property string|null $center_reference
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class PreOrderQuotation extends Model
{
    protected $fillable = [
        'pre_order_id', 'request_id', 'number', 'reasons', 'reason', 'status', 'subtotal', 'discount',
        'total', 'approved_amount', 'expires_at', 'created_by', 'decided_by', 'decided_at', 'note',
        'center_reference',
    ];

    protected $casts = [
        'reasons' => 'array',
        'status' => FinanceStatus::class,
        'subtotal' => 'decimal:3',
        'discount' => 'decimal:3',
        'total' => 'decimal:3',
        'approved_amount' => 'decimal:3',
        'expires_at' => 'datetime',
        'decided_at' => 'datetime',
    ];

    /** @return BelongsTo<PreOrder, $this> */
    public function preOrder(): BelongsTo
    {
        return $this->belongsTo(PreOrder::class);
    }

    /** @return BelongsTo<PreOrderRequest, $this> */
    public function request(): BelongsTo
    {
        return $this->belongsTo(PreOrderRequest::class, 'request_id');
    }

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** @return HasMany<PreOrderItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(PreOrderItem::class, 'quotation_id');
    }
}
