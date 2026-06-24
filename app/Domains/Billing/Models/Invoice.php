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
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * Runtime-computed attributes (not DB columns): a formatted invoice number set by
 * InvoiceService/selectRaw, and an owner-mismatch flag set during shaping.
 *
 * @property string|null $invoiceNo
 * @property bool $has_different_owner
 * @property int $id
 * @property string $owner_type
 * @property int $owner_id
 * @property int|null $statement_id
 * @property int $user_id
 * @property int $discount
 * @property string $status
 * @property array<array-key, mixed>|null $subject
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
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


    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function owner(): MorphTo
    {
        return $this->morphTo();
    }

    /** @return HasMany<Acceptance, $this> */
    public function acceptances(): HasMany
    {
        return $this->hasMany(Acceptance::class);
    }

    /** @return HasOne<Acceptance, $this> */
    public function acceptance(): HasOne
    {
        return $this->hasOne(Acceptance::class);
    }

    /** @return HasManyThrough<AcceptanceItem, Acceptance, $this> */
    public function acceptanceItems(): HasManyThrough
    {
        return $this->hasManyThrough(AcceptanceItem::class, Acceptance::class);
    }

    /** @return HasMany<InvoiceItem, $this> */
    public function invoiceItems(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    /** @return HasMany<Payment, $this> */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /** @return HasOneThrough<Patient, Acceptance, $this> */
    public function patient(): HasOneThrough
    {
        return $this->hasOneThrough(Patient::class, Acceptance::class, "invoice_id", "id", "id", "patient_id");
    }

    /** @return HasOneThrough<Referrer, Acceptance, $this> */
    public function referrer(): HasOneThrough
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

    /** @return BelongsTo<Statement, $this> */
    public function statement(): BelongsTo
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
