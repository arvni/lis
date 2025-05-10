<?php

namespace App\Domains\Consultation\Models;

use App\Domains\Consultation\Enums\ConsultationStatus;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\Patient;
use Illuminate\Database\Eloquent\Model;

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
     */
    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    /**
     * Get the consultant (user) associated with the consultation.
     */
    public function consultant()
    {
        return $this->belongsTo(Consultant::class);
    }

    public function time()
    {
        return $this->morphOne(Time::class, "reservable");
    }

    public function acceptance()
    {
        return $this->hasOne(Acceptance::class);
    }

}
