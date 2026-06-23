<?php

namespace App\Domains\Reception\Models;

use App\Domains\Laboratory\Models\SampleType;
use App\Domains\Referrer\Models\CollectRequest;
use App\Domains\Referrer\Models\Material;
use App\Domains\User\Models\User;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;

class Sample extends Model
{
    use HasFactory, Searchable;

    protected $fillable = [
        "barcode",
        "status",
        "qc",
        "qc_status",
        "qc_approved_by_id",
        "qc_approved_at",
        "storeAddress",
        "sample_type_id",
        "patient_id",
        "collect_request_id",
        "collection_date",
        "sampler_id",
        "material_id",
        "received_at",
        "rejection_reason",
    ];

    protected $casts = [
        "qc_approved_at" => "datetime",
    ];

    protected $searchable = [
        "barcode",
        "patient.idNo",
        "patient.fullName",
        "samples.barcode"
    ];

    /** @return BelongsToMany<AcceptanceItem, $this> */
    public function acceptanceItems(): BelongsToMany
    {
        return $this->belongsToMany(AcceptanceItem::class, "acceptance_item_samples")
            ->withPivot("active");
    }

    /** @return HasManyThrough<Sample, AcceptanceItemSample, $this> */
    public function acceptances(): HasManyThrough
    {
        return $this->hasManyThrough(
            Sample::class,
            AcceptanceItemSample::class,
            'acceptance_item_id', // FK on acceptance_item_sample
            'id',                 // FK on samples
            'id',                 // local key on acceptances
            'sample_id'           // local key on acceptance_item_sample pivot
        )
            ->distinct();
    }

    /** @return HasOneThrough<Sample, AcceptanceItemSample, $this> */
    public function acceptance(): HasOneThrough
    {
        return $this->hasOneThrough(
            Sample::class,
            AcceptanceItemSample::class,
            'acceptance_item_id', // FK on acceptance_item_sample
            'id',                 // FK on samples
            'id',                 // local key on acceptances
            'sample_id'           // local key on acceptance_item_sample pivot
        )
            ->where("acceptance_item_samples.active", true)
            ->distinct();
    }


    public function activeAcceptanceItems()
    {
        return $this->acceptanceItems()
            ->wherePivot("active", true);
    }

    public function deactivateAcceptanceItems()
    {
        return $this->acceptanceItems()
            ->wherePivot("active", false);
    }


    /** @return BelongsTo<Patient, $this> */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    /** @return BelongsTo<SampleType, $this> */
    public function sampleType(): BelongsTo
    {
        return $this->belongsTo(SampleType::class);
    }

    /** @return BelongsTo<User, $this> */
    public function sampler(): BelongsTo
    {
        return $this->belongsTo(User::class, "sampler_id",);
    }

    /** @return BelongsTo<User, $this> */
    public function qCPerson(): BelongsTo
    {
        return $this->belongsTo(User::class, "qc_by_id");
    }

    /** @return BelongsTo<User, $this> */
    public function qcApprovedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, "qc_approved_by_id");
    }

    /** @return HasMany<Sample, $this> */
    public function samples(): HasMany
    {
        return $this->hasMany(Sample::class);
    }

    /** @return BelongsTo<Material, $this> */
    public function material(): BelongsTo
    {
        return $this->belongsTo(Material::class);
    }

    /** @return BelongsTo<CollectRequest, $this> */
    public function collectRequest(): BelongsTo
    {
        return $this->belongsTo(CollectRequest::class);
    }
}
