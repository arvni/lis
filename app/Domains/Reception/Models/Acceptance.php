<?php

namespace App\Domains\Reception\Models;

use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Models\Payment;
use App\Domains\Consultation\Models\Consultation;
use App\Domains\Document\Models\Document;
use App\Domains\Laboratory\Models\Doctor;
use App\Domains\Reception\Enums\AcceptancePriority;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Referrer\Models\Referrer;
use App\Domains\Referrer\Models\ReferrerOrder;
use App\Domains\User\Models\User;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\MorphOne;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Staudenmeir\EloquentHasManyDeep\HasManyDeep;
use Staudenmeir\EloquentHasManyDeep\HasRelationships;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Acceptance extends Model
{
    use Searchable, HasRelationships;

    protected $fillable = [
        "patient_id",
        "consultation_id",
        "out_patient",
        "waiting_for_pooling",
        "invoice_id",
        "referrer_id",
        "sampler_id",
        "acceptor_id",
        "doctor_id",
        "referenceCode",
        "samplerGender",
        "howReport",
        "status",
        "step",
        "financial_approved",
        "financial_approved_by",
        "financial_approved_at",
        "priority",
        "how_found_us",
    ];

    protected $casts = [
        "out_patient" => "boolean",
        "waiting_for_pooling" => "boolean",
        "howReport" => "json",
        "status" => AcceptanceStatus::class,
        "priority" => AcceptancePriority::class,
    ];

    protected $searchable = [
        "referenceCode",
        "patient.fullName",
        "patient.idNo",
        "patient.phone",
        "samples.barcode"
    ];

    protected $appends = [
        "referred",
    ];

    public function getReferredAttribute(): bool
    {
        return boolval($this->referrer_id);
    }

    /** @return BelongsTo<Patient, $this> */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    /** @return BelongsTo<Invoice, $this> */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    /** @return HasManyThrough<Payment, Invoice, $this> */
    public function payments(): HasManyThrough
    {
        return $this->hasManyThrough(
            Payment::class,
            Invoice::class,
            'id',
            'invoice_id',
            'invoice_id',
            'id'
        );
    }

    /** @return BelongsTo<Referrer, $this> */
    public function referrer(): BelongsTo
    {
        return $this->belongsTo(Referrer::class);
    }

    /** @return HasMany<ReferrerOrder, $this> */
    public function referrerOrders(): HasMany
    {
        return $this->hasMany(ReferrerOrder::class);
    }

    /** @return BelongsTo<User, $this> */
    public function acceptor(): BelongsTo
    {
        return $this->belongsTo(User::class, "acceptor_id");
    }

    /** @return BelongsTo<Doctor, $this> */
    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }


    /** @return BelongsTo<User, $this> */
    public function sampler(): BelongsTo
    {
        return $this->belongsTo(User::class,"sampler_id");
    }

    /** @return BelongsTo<Consultation, $this> */
    public function consultation(): BelongsTo
    {
        return $this->belongsTo(Consultation::class);
    }

    /** @return BelongsTo<User, $this> */
    public function financialApprovedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, "financial_approved_by");
    }

    /** @return HasMany<AcceptanceItem, $this> */
    public function acceptanceItems(): HasMany
    {
        return $this->hasMany(AcceptanceItem::class);
    }

    /** @return MorphToMany<Tag, $this> */
    public function tags(): MorphToMany
    {
        return $this->morphToMany(Tag::class, 'taggable')->withTimestamps();
    }

    /** @return HasManyThrough<AcceptanceItemState, AcceptanceItem, $this> */
    public function acceptanceItemStates(): HasManyThrough
    {
        return $this->hasManyThrough(AcceptanceItemState::class, AcceptanceItem::class);
    }

    /** @return MorphOne<Document, $this> */
    public function prescription(): MorphOne
    {
        return $this->morphOne(Document::class, "related")
            ->where("tag", "prescription");
    }

    public function samples(): HasManyDeep
    {
        return $this->hasManyDeep(
            Sample::class,
            [AcceptanceItem::class, AcceptanceItemSample::class],
            [
                'acceptance_id',
                'acceptance_item_id',
            ],
            [
                'id',
                'id',
            ]
        );
    }
    // In your Acceptance model
    /** @return HasOne<AcceptanceItem, $this> */
    public function reportDate(): HasOne
    {
        return $this->hasOne(AcceptanceItem::class)
            ->join('method_tests', 'method_tests.id', '=', 'acceptance_items.method_test_id')
            ->join('methods', 'methods.id', '=', 'method_tests.method_id')
            ->selectRaw('acceptance_items.acceptance_id, MAX(DATE_ADD(acceptance_items.created_at, INTERVAL methods.turnaround_time + 2 * FLOOR((methods.turnaround_time + WEEKDAY(acceptance_items.created_at)) / 5) DAY)) as report_date')
            ->groupBy('acceptance_items.acceptance_id')
            ->withDefault(['report_date' => null]);
    }

}
