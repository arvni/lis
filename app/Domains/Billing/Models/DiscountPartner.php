<?php

declare(strict_types=1);

namespace App\Domains\Billing\Models;

use App\Domains\Laboratory\Models\Offer;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * A company the lab has a discount contract with. Its cards entitle whoever
 * presents them to the discounts defined by the attached offers.
 *
 * @property int $id
 * @property string $name
 * @property string|null $contract_no
 * @property array<array-key, mixed>|null $contact
 * @property Carbon|null $starts_at
 * @property Carbon|null $ends_at
 * @property bool $active
 * @property string|null $notes
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 * @property-read int|null $cards_count withCount alias
 */
class DiscountPartner extends Model
{
    use Searchable, SoftDeletes;

    protected $fillable = [
        'name',
        'contract_no',
        'contact',
        'starts_at',
        'ends_at',
        'active',
        'notes',
    ];

    protected $casts = [
        'contact' => 'json',
        'starts_at' => 'date:Y-m-d',
        'ends_at' => 'date:Y-m-d',
        'active' => 'boolean',
    ];

    /** @var list<string> */
    protected $searchable = [
        'name',
        'contract_no',
    ];

    /** @return BelongsToMany<Offer, $this> */
    public function offers(): BelongsToMany
    {
        return $this->belongsToMany(Offer::class, 'discount_partner_offer')->withTimestamps();
    }

    /** @return HasMany<DiscountCardBatch, $this> */
    public function batches(): HasMany
    {
        return $this->hasMany(DiscountCardBatch::class);
    }

    /** @return HasMany<DiscountCard, $this> */
    public function cards(): HasMany
    {
        return $this->hasMany(DiscountCard::class);
    }

    /**
     * Whether the contract itself is live today. A card can never out-live its partner.
     */
    public function isInForce(): bool
    {
        if (! $this->active) {
            return false;
        }
        $today = now()->startOfDay();

        return ! ($this->starts_at && $this->starts_at->gt($today))
            && ! ($this->ends_at && $this->ends_at->lt($today));
    }
}
