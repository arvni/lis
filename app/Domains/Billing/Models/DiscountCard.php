<?php

declare(strict_types=1);

namespace App\Domains\Billing\Models;

use App\Domains\Billing\Enums\DiscountCardStatus;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * A bearer card. It identifies the partner and nothing about the person holding it,
 * so it can be handed around inside the company without touching patient data.
 *
 * @property int $id
 * @property string $uuid
 * @property int $discount_card_batch_id
 * @property int $discount_partner_id
 * @property string $series
 * @property int $serial
 * @property string $number
 * @property DiscountCardStatus $status
 * @property Carbon|null $issued_at
 * @property Carbon|null $activated_at
 * @property Carbon|null $expires_at
 * @property int|null $usage_limit
 * @property int $used_count
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 */
class DiscountCard extends Model
{
    use Searchable, SoftDeletes;

    protected $fillable = [
        'uuid',
        'discount_card_batch_id',
        'discount_partner_id',
        'series',
        'serial',
        'number',
        'status',
        'issued_at',
        'activated_at',
        'expires_at',
        'usage_limit',
        'used_count',
    ];

    protected $casts = [
        'status' => DiscountCardStatus::class,
        'serial' => 'integer',
        'usage_limit' => 'integer',
        'used_count' => 'integer',
        'issued_at' => 'datetime',
        'activated_at' => 'datetime',
        'expires_at' => 'date:Y-m-d',
    ];

    /** @var list<string> */
    protected $searchable = [
        'number',
        'series',
        'uuid',
    ];

    /** @return BelongsTo<DiscountPartner, $this> */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(DiscountPartner::class, 'discount_partner_id');
    }

    /** @return BelongsTo<DiscountCardBatch, $this> */
    public function batch(): BelongsTo
    {
        return $this->belongsTo(DiscountCardBatch::class, 'discount_card_batch_id');
    }

    /** @return HasMany<DiscountCardRedemption, $this> */
    public function redemptions(): HasMany
    {
        return $this->hasMany(DiscountCardRedemption::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->lt(now()->startOfDay());
    }

    public function hasReachedUsageLimit(): bool
    {
        return $this->usage_limit !== null && $this->used_count >= $this->usage_limit;
    }
}
