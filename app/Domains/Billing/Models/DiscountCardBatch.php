<?php

declare(strict_types=1);

namespace App\Domains\Billing\Models;

use App\Domains\User\Models\User;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * One print run. Its partner is optional: a run can be minted as stock, printed,
 * and kept in a drawer until someone decides which partner it goes to.
 *
 * @property int $id
 * @property int|null $discount_partner_id
 * @property string $series
 * @property string|null $prefix
 * @property string|null $number_template
 * @property int $quantity
 * @property int $serial_from
 * @property Carbon|null $expires_at
 * @property int|null $usage_limit
 * @property int|null $issued_by
 * @property Carbon|null $printed_at
 * @property string|null $notes
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read int|null $cards_count withCount alias
 */
class DiscountCardBatch extends Model
{
    use Searchable;

    protected $fillable = [
        'discount_partner_id',
        'series',
        'prefix',
        'number_template',
        'quantity',
        'serial_from',
        'expires_at',
        'usage_limit',
        'issued_by',
        'printed_at',
        'notes',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'serial_from' => 'integer',
        'usage_limit' => 'integer',
        'expires_at' => 'date:Y-m-d',
        'printed_at' => 'datetime',
    ];

    /** @var list<string> */
    protected $searchable = [
        'series',
        'prefix',
    ];

    /** @return BelongsTo<DiscountPartner, $this> */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(DiscountPartner::class, 'discount_partner_id');
    }

    /** @return HasMany<DiscountCard, $this> */
    public function cards(): HasMany
    {
        return $this->hasMany(DiscountCard::class);
    }

    /** @return BelongsTo<User, $this> */
    public function issuer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issued_by');
    }

    /** The last serial this batch covers; serials are contiguous from serial_from. */
    public function serialTo(): int
    {
        return $this->serial_from + $this->quantity - 1;
    }
}
