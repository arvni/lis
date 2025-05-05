<?php

namespace App\Domains\Laboratory\Models;

use App\Domains\Reception\Models\Acceptance;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

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

    public function acceptances(): HasMany
    {
        return $this->hasMany(Acceptance::class);
    }

}
