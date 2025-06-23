<?php

namespace App\Domains\Billing\Models;

use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Patient;
use App\Domains\Referrer\Models\Referrer;
use App\Domains\User\Models\User;
use App\Traits\Searchable;
use DB;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use Searchable;

    protected $fillable = [
        'user_id',
        'owner_id',
        'owner_type',
        'status',
        'total_price',
        'discount',
    ];

    protected $searchable = [
        'owner.fullName',
        'patient.fullName',
        'patient.idNo',
    ];


    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function owner()
    {
        return $this->morphTo();
    }

    public function acceptances()
    {
        return $this->hasMany(Acceptance::class);
    }

    public function acceptance()
    {
        return $this->hasOne(Acceptance::class);
    }

    public function acceptanceItems()
    {
        return $this->hasManyThrough(AcceptanceItem::class, Acceptance::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function patient()
    {
        return $this->hasOneThrough(Patient::class, Acceptance::class, "invoice_id", "id", "id", "patient_id");
    }

    public function referrer()
    {
        return $this->hasOneThrough(Referrer::class, Acceptance::class, "invoice_id", "id", "id", "referrer_id");
    }

    public function patientPayments()
    {
        return $this->Payments()->whereMorphedTo("payer", Patient::class);
    }

    public function sponsorPayments()
    {
        return $this->Payments()->whereMorphedTo("payer", Referrer::class);
    }

    /**
     * Check if this invoice is fully paid
     *
     * @return bool
     */
    public function isPaid(): bool
    {
        $totalAmount = $this->acceptanceItems()->sum(DB::raw('price - discount'));
        $totalPaid = $this->payments()->sum('price');
        return $totalPaid >= $totalAmount;
    }

    /**
     * Check if this invoice is partially paid
     *
     * @return bool
     */
    public function isPartiallyPaid(): bool
    {
        $totalAmount = $this->acceptanceItems()->sum(DB::raw('price - discount'));
        $totalPaid = $this->payments()->sum('price');

        return $totalPaid > 0 && $totalPaid < $totalAmount;
    }
}
