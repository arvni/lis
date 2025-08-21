<?php

namespace App\Domains\Reception\Models;

use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Models\Payment;
use App\Domains\Consultation\Models\Consultation;
use App\Domains\Document\Models\Document;
use App\Domains\Laboratory\Models\Doctor;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Referrer\Models\Referrer;
use App\Domains\Referrer\Models\ReferrerOrder;
use App\Domains\User\Models\User;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphOne;
use Staudenmeir\EloquentHasManyDeep\HasManyDeep;
use Staudenmeir\EloquentHasManyDeep\HasRelationships;

class Acceptance extends Model
{
    use Searchable, HasRelationships;

    protected $fillable = [
        "patient_id",
        "consultation_id",
        "out_patient",
        "invoice_id",
        "referrer_id",
        "acceptor_id",
        "doctor_id",
        "referenceCode",
        "samplerGender",
        "howReport",
        "status",
        "step"
    ];

    protected $casts = [
        "out_patient" => "boolean",
        "howReport" => "json",
        "status" => AcceptanceStatus::class
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

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

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

    public function referrer(): BelongsTo
    {
        return $this->belongsTo(Referrer::class);
    }

    public function referrerOrder(): HasOne
    {
        return $this->hasOne(ReferrerOrder::class);
    }

    public function acceptor(): BelongsTo
    {
        return $this->belongsTo(User::class, "acceptor_id");
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    public function consultation(): BelongsTo
    {
        return $this->belongsTo(Consultation::class);
    }

    public function acceptanceItems(): HasMany
    {
        return $this->hasMany(AcceptanceItem::class);
    }

    public function acceptanceItemStates()
    {
        return $this->hasManyThrough(AcceptanceItemState::class, AcceptanceItem::class);
    }

    public function prescription(): MorphOne
    {
        return $this->morphOne(Document::class, "related")
            ->where("tag", "prescription");
    }

    public function samples(): HasManyDeep
    {
        return $this->hasManyDeep(
            Sample::class,
            [AcceptanceItem::class, 'acceptance_item_samples'], // Through models and pivot
            [
                'acceptance_id',          // Foreign key on AcceptanceItem table
                'acceptance_item_id',     // Foreign key on pivot table
            ],
            [
                'id',                     // Local key on Acceptance table
                'id'                      // Local key on AcceptanceItem table
            ]
        );
    }
    // In your Acceptance model
    public function reportDate()
    {
        return $this->hasOne(AcceptanceItem::class)
            ->join('method_tests', 'method_tests.id', '=', 'acceptance_items.method_test_id')
            ->join('methods', 'methods.id', '=', 'method_tests.method_id')
            ->selectRaw('acceptance_items.acceptance_id, MAX(methods.turnaround_time) as report_date')
            ->groupBy('acceptance_items.acceptance_id')
            ->withDefault(['report_date' => null]);
    }

}
