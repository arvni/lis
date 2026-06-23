<?php

namespace App\Domains\Referrer\Models;

use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Models\Payment;
use App\Domains\Laboratory\Models\Method;
use App\Domains\Laboratory\Models\Offer;
use App\Domains\Reception\Models\Acceptance;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Notifications\Notifiable;
use Illuminate\Notifications\Notification;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Referrer extends Model
{
    use HasFactory, Notifiable, Searchable;

    protected $fillable = [
        "fullName",
        "email",
        "phoneNo",
        "billingInfo",
        "isActive",
        "reportReceivers",
        "logisticInfo"
    ];

    protected $casts = [
        "billingInfo" => "json",
        "logisticInfo" => "json",
        "reportReceivers" => "json",
        "isActive" => "boolean"
    ];

    protected $appends = [
        "name"
    ];
    protected $searchable = [
        "fullName",
        "email",
        "phoneNo",
    ];

    public function getNameAttribute()
    {
        return $this->attributes["fullName"] ?? null;
    }

    /**
     * Route mail notifications to an address the notification supplies
     * (e.g. WelcomeNotification's per-acceptance email), else the default.
     */
    public function routeNotificationForMail(Notification $notification): string|array|null
    {
        if (method_exists($notification, "routeAddressForMail") && ($address = $notification->routeAddressForMail())) {
            return $address;
        }

        return $this->email ?? null;
    }

    /** @return HasMany<Acceptance, $this> */
    public function acceptances(): HasMany
    {
        return $this->hasMany(Acceptance::class);
    }

    /** @return MorphMany<Invoice, $this> */
    public function invoices(): MorphMany
    {
        return $this->morphMany(Invoice::class, 'owner');
    }


    /** @return MorphMany<Payment, $this> */
    public function payments(): MorphMany
    {
        return $this->morphMany(Payment::class, 'payer');
    }

    /** @return BelongsToMany<ReferrerTest, $this> */
    public function tests(): BelongsToMany
    {
        return $this->belongsToMany(ReferrerTest::class, "referrer_tests")
            ->withPivot([
                "price",
                "method"
            ]);
    }

    /** @return HasMany<ReferrerTest, $this> */
    public function referrerTests(): HasMany
    {
        return $this->hasMany(ReferrerTest::class);
    }

    /** @return HasMany<ReferrerOrder, $this> */
    public function referrerOrders(): HasMany
    {
        return $this->hasMany(ReferrerOrder::class);
    }

    /** @return HasMany<CollectRequest, $this> */
    public function collectRequests(): HasMany
    {
        return $this->hasMany(CollectRequest::class);
    }

    /** @return HasMany<OrderMaterial, $this> */
    public function orderMaterials(): HasMany
    {
        return $this->hasMany(OrderMaterial::class);
    }

    /** @return BelongsToMany<Offer, $this> */
    public function offers(): BelongsToMany
    {
        return $this->belongsToMany(Offer::class, 'offer_referrer');
    }
}
