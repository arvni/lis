<?php

namespace App\Domains\Reception\Models;

use App\Domains\Laboratory\Models\SampleType;
use App\Domains\Referrer\Models\Material;
use App\Domains\User\Models\User;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sample extends Model
{
    use HasFactory, Searchable;

    protected $fillable = [
        "barcode",
        "status",
        "qc",
        "storeAddress",
        "sample_type_id",
        "patient_id",
        "collection_date",
        "sampler_id",
        "material_id",
        "received_at"
    ];

    protected $searchable = [
        "barcode",
        "patient.idNo",
        "patient.fullName",
        "samples.barcode"
    ];

    public function acceptanceItems()
    {
        return $this->belongsToMany(AcceptanceItem::class, "acceptance_item_samples")
            ->withPivot("active");
    }

    public function acceptances()
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

    public function acceptance()
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


    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function sampleType()
    {
        return $this->belongsTo(SampleType::class);
    }

    public function sampler()
    {
        return $this->belongsTo(User::class, "sampler_id",);
    }

    public function qCPerson()
    {
        return $this->belongsTo(User::class, "qc_by_id");
    }

    public function samples()
    {
        return $this->hasMany(Sample::class);
    }

    public function material()
    {
        return $this->belongsTo(Material::class);
    }
}
