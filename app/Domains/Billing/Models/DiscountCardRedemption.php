<?php

declare(strict_types=1);

namespace App\Domains\Billing\Models;

use App\Domains\Laboratory\Models\Offer;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * One acceptance item discounted by one card. The lab absorbs these amounts —
 * nobody is invoiced for them — so this ledger exists for reporting and control only.
 *
 * @property int $id
 * @property int $discount_card_id
 * @property int $acceptance_id
 * @property int $acceptance_item_id
 * @property int|null $invoice_id
 * @property int $offer_id
 * @property numeric $amount
 * @property int|null $applied_by
 * @property Carbon|null $applied_at
 * @property Carbon|null $reverted_at
 * @property string|null $revert_reason
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class DiscountCardRedemption extends Model
{
    protected $fillable = [
        'discount_card_id',
        'acceptance_id',
        'acceptance_item_id',
        'invoice_id',
        'offer_id',
        'amount',
        'applied_by',
        'applied_at',
        'reverted_at',
        'revert_reason',
    ];

    protected $casts = [
        'applied_at' => 'datetime',
        'reverted_at' => 'datetime',
    ];

    /** @return BelongsTo<DiscountCard, $this> */
    public function card(): BelongsTo
    {
        return $this->belongsTo(DiscountCard::class, 'discount_card_id');
    }

    /** @return BelongsTo<Acceptance, $this> */
    public function acceptance(): BelongsTo
    {
        return $this->belongsTo(Acceptance::class);
    }

    /** @return BelongsTo<AcceptanceItem, $this> */
    public function acceptanceItem(): BelongsTo
    {
        return $this->belongsTo(AcceptanceItem::class);
    }

    /** @return BelongsTo<Offer, $this> */
    public function offer(): BelongsTo
    {
        return $this->belongsTo(Offer::class);
    }

    /** @return BelongsTo<User, $this> */
    public function applier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'applied_by');
    }
}
