<?php

namespace App\Domains\Reception\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $patient_id
 * @property int|null $maritalStatus
 * @property string|null $company
 * @property string|null $profession
 * @property string|null $avatar
 * @property string|null $address
 * @property string|null $email
 * @property string|null $details
 * @property string|null $created_at
 * @property string|null $updated_at
 */
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
