<?php

namespace App\Domains\Reception\Models;

use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Models\Payment;
use App\Domains\Consultation\Models\Consultation;
use App\Domains\Document\Models\Document;
use App\Domains\User\Models\User;
use App\Traits\Searchable;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;
use Staudenmeir\EloquentHasManyDeep\HasRelationships;

class Patient extends Model
{
    use HasFactory, Notifiable, Searchable,HasRelationships;


    protected $fillable = [
        "fullName",
        "idNo",
        "nationality",
        "dateOfBirth",
        "gender",
        "avatar",
        "phone",
        "research",
        "tribe",
        "wilayat",
        "village",
    ];
    protected $casts = [
        "dateOfBirth" => "date:Y-m-d",
        "research" => "boolean",
    ];
    protected $appends = [
        "age",
        "name"
    ];

    protected $searchable = [
        "fullName",
        "idNo",
        "phone"
    ];

    public function getNameAttribute()
    {
        return $this->attributes["fullName"];
    }

    public function getAgeAttribute()
    {
        $diff = Carbon::parse($this->dateOfBirth)->diff(Carbon::now());

        if ($diff->y >= 1) {
            return $diff->y . ' Y';
        } elseif ($diff->m >= 1) {
            return $diff->m . ' M';
        } else {
            return $diff->d . ' D';
        }
    }

    public function acceptanceItems()
    {
        return $this->belongsToMany(AcceptanceItem::class, "acceptance_item_patient")
            ->withPivot("order");
    }
    public function acceptances()
    {
        return $this->hasManyDeepFromRelations(
            $this->acceptanceItems(),           // Patient → AcceptanceItem (through pivot)
            (new AcceptanceItem)->acceptance()  // AcceptanceItem → Acceptance
        )->distinct(); // Use distinct to avoid duplicate acceptances if patient has multiple items per acceptance
    }

    public function consultations()
    {
        return $this->hasMany(Consultation::class);
    }

    public function consultation()
    {
        return $this->hasOne(Consultation::class)->latest();
    }

    public function patientMeta()
    {
        return $this->hasOne(PatientMeta::class);
    }

    public function registrar()
    {
        return $this->belongsTo(User::class, 'registrar_id', 'id');
    }

    public function patients()
    {
        return $this->belongsToMany(Patient::class, 'relatives', 'patient_id',"relative_id")
            ->withPivot("relationship", "id");
    }

    public function relatives()
    {
        return $this->belongsToMany(Patient::class, 'relatives', 'relative_id',"patient_id")
            ->withPivot("relationship", "id");
    }

    public function invoices()
    {
        return $this->morphMany(Invoice::class, 'owner');
    }

    public function payments()
    {
        return $this->morphMany(Payment::class, 'payer');
    }

    public function ownedDocuments()
    {
        return $this->morphMany(Document::class, "owner");
    }

    public function relatedDocuments()
    {
        return $this->morphMany(Document::class, "related");
    }

    public function samples()
    {
        return $this->hasMany(Sample::class);
    }

    public function scopeIsResearch($query, $isResearch)
    {
        return $query->where("research", $isResearch);
    }
}
