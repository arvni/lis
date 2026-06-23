<?php

namespace App\Domains\Reception\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatientMeta extends Model
{
    use HasFactory;

    protected $fillable = [
        "maritalStatus",
        'company',
        "profession",
        "avatar",
        "address",
        "email",
        "details"
    ];

    public $timestamps=false;

    /** @return BelongsTo<Patient, $this> */
    public function Patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }
}
