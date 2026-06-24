<?php

namespace App\Domains\Referrer\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class SampleCollector extends Model
{
    use HasFactory;

    protected $fillable = [
        "name",
        "email",
    ];

    /** @return HasMany<CollectRequest, $this> */
    public function collectRequests(): HasMany
    {
        return $this->hasMany(CollectRequest::class);
    }
}
