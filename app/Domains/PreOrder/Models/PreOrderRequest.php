<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Models;

use App\Domains\PreOrder\Enums\RequestStatus;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $pre_order_id
 * @property int $number
 * @property list<string> $types
 * @property string $reason
 * @property string $message
 * @property array<string, mixed>|null $needs
 * @property bool $blocking
 * @property Carbon|null $due_at
 * @property RequestStatus $status
 * @property string|null $answer
 * @property int|null $raised_by
 * @property Carbon|null $answered_at
 * @property Carbon|null $closed_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class PreOrderRequest extends Model
{
    protected $fillable = [
        'pre_order_id', 'number', 'types', 'reason', 'message', 'needs', 'blocking', 'due_at',
        'status', 'answer', 'raised_by', 'answered_at', 'closed_at',
    ];

    protected $casts = [
        'types' => 'array',
        'needs' => 'array',
        'blocking' => 'boolean',
        'due_at' => 'datetime',
        'status' => RequestStatus::class,
        'answered_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    /** @return BelongsTo<PreOrder, $this> */
    public function preOrder(): BelongsTo
    {
        return $this->belongsTo(PreOrder::class);
    }

    /** @return BelongsTo<User, $this> */
    public function raiser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'raised_by');
    }

    /** @return HasMany<PreOrderItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(PreOrderItem::class, 'request_id');
    }

    public function label(): string
    {
        return 'R'.$this->number;
    }
}
