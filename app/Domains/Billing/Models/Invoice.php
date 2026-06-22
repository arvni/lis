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
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Runtime-computed attributes (not DB columns): a formatted invoice number set by
 * InvoiceService/selectRaw, and an owner-mismatch flag set during shaping.
 *
 * @property string|null $invoiceNo
 * @property bool $has_different_owner
 */
class Invoice extends Model
{
    use Searchable;

    protected $touches = ['statement'];

    protected $fillable = [
        'statement_id',
        'user_id',
        'owner_id',
        'owner_type',
        'status',
        'subject',
        'total_price',
        'discount',
    ];

    protected $casts = [
        'subject' => 'array',
    ];

    protected $searchable = [
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

    public function invoiceItems(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
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

    public function statement()
    {
        return $this->belongsTo(Statement::class);
    }

    public function totalAmount(): float
    {
        return (float) $this->invoiceItems()->sum(DB::raw('price - discount'));
    }

    public function isPaid(): bool
    {
        return (float) $this->payments()->sum('price') >= $this->totalAmount();
    }

    public function isPartiallyPaid(): bool
    {
        $totalPaid = (float) $this->payments()->sum('price');
        return $totalPaid > 0 && $totalPaid < $this->totalAmount();
    }
}
