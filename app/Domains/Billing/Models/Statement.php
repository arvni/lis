<?php

namespace App\Domains\Billing\Models;

use App\Domains\Reception\Models\Acceptance;
use App\Domains\Referrer\Models\Referrer;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Statement extends Model
{
    use Searchable;

    protected $fillable = [
        "no",
        "issue_date",
        "referrer_id"
    ];

    protected $searchable = [
        "referrer.fullName"
    ];

    /** @return HasManyThrough<Acceptance, Invoice, $this> */
    public function acceptances(): HasManyThrough
    {
        return $this->hasManyThrough(Acceptance::class,Invoice::class);
    }

    /** @return BelongsTo<Referrer, $this> */
    public function referrer(): BelongsTo
    {
        return $this->belongsTo(Referrer::class);
    }

    /** @return HasMany<Invoice, $this> */
    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }
}
