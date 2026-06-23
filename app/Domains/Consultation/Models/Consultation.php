<?php

namespace App\Domains\Consultation\Models;

use App\Domains\Consultation\Enums\ConsultationStatus;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\Patient;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class Consultation extends Model
{
    protected $fillable = [
        'patient_id',
        'consultant_id',
        'dueDate',
        'information',
        'status',
        'started_at',
        'image',
    ];

    protected $casts = [
        'dueDate' => 'datetime',
        'started_at' => 'datetime',
        "status" => ConsultationStatus::class,
        "information" => "json"
    ];

    /**
     * Get the patient associated with the consultation.
     * @return BelongsTo<Patient, $this>
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    /**
     * Get the consultant (user) associated with the consultation.
     * @return BelongsTo<Consultant, $this>
     */
    public function consultant(): BelongsTo
    {
        return $this->belongsTo(Consultant::class);
    }

    /** @return MorphOne<Time, $this> */
    public function time(): MorphOne
    {
        return $this->morphOne(Time::class, "reservable");
    }

    /** @return HasOne<Acceptance, $this> */
    public function acceptance(): HasOne
    {
        return $this->hasOne(Acceptance::class);
    }

}
