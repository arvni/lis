<?php

namespace App\Domains\Laboratory\Models;

use App\Domains\Laboratory\Enums\OfferType;
use App\Domains\Referrer\Models\Referrer;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * @property int $id
 * @property string $title
 * @property string|null $description
 * @property \App\Domains\Laboratory\Enums\OfferType $type
 * @property numeric $amount
 * @property \Illuminate\Support\Carbon|null $started_at
 * @property \Illuminate\Support\Carbon|null $ended_at
 * @property bool $active
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class Offer extends Model
{
    protected $fillable = [
        "title",
        "description",
        "type",
        "amount",
        "started_at",
        "ended_at",
        "active",
    ];

    protected $casts = [
        "type" => OfferType::class,
        "started_at" => "date:Y-m-d",
        "ended_at" => "date:Y-m-d",
        "active" => "boolean"
    ];

    /** @return BelongsToMany<Test, $this> */
    public function tests(): BelongsToMany
    {
        return $this->belongsToMany(Test::class, "offer_test");
    }

    /** @return BelongsToMany<Referrer, $this> */
    public function referrers(): BelongsToMany
    {
        return $this->belongsToMany(Referrer::class, "offer_referrer");
    }

}
