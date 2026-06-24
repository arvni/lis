<?php

namespace App\Domains\Laboratory\Models;

use App\Domains\Reception\Models\Acceptance;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property string|null $expertise
 * @property string|null $phone
 * @property string|null $license_no
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class Doctor extends Model
{
    use Searchable;

    protected $searchable = [
        "name",
        "expertise",
        "phone",
        "license_no"
    ];

    protected $fillable = [
        "name",
        "expertise",
        "phone",
        "license_no"
    ];

    /** @return HasMany<Acceptance, $this> */
    public function acceptances(): HasMany
    {
        return $this->hasMany(Acceptance::class);
    }

}
