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
use Illuminate\Notifications\Notifiable;

class Referrer extends Model
{
    use HasFactory, Notifiable, Searchable;

    protected $fillable = [
        "fullName",
        "email",
        "phoneNo",
        "billingInfo",
        "isActive",
    ];

    protected $casts = [
        "billingInfo" => "json",
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
        return $this->attributes["fullName"];
    }

    public function acceptances()
    {
        return $this->hasMany(Acceptance::class);
    }

    public function invoices()
    {
        return $this->morphMany(Invoice::class, 'owner');
    }


    public function payments()
    {
        return $this->morphMany(Payment::class, 'payer');
    }

    public function methods()
    {
        return $this->belongsToMany(Method::class, "referrer_methods")
            ->withPivot([
                "price",
                "price_type",
                "extra",
            ]);
    }

    public function referrerOrders()
    {
        return $this->hasMany(ReferrerOrder::class);
    }

    public function offers()
    {
        return $this->belongsToMany(Offer::class, 'offer_referrer');
    }
}
