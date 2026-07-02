<?php

namespace App\Domains\Consultation\Models;

use App\Domains\Reception\Models\Patient;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;


/**
 * @property int $id
 * @property int|null $patient_id
 * @property string $name
 * @property string|null $email
 * @property string $phone
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class Customer extends Model
{
    use Searchable;

    protected $fillable = [
        "name",
        "phone",
        "email"
    ];
    /** @var list<string> */
    protected $searchable = [
        "name",
        "phone"
    ];


    /** @return MorphMany<Time, $this> */
    public function times(): MorphMany
    {
        return $this->morphMany(Time::class, "reservable");
    }

    /** @return BelongsTo<Patient, $this> */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

}
