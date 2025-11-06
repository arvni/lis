<?php

namespace App\Domains\Referrer\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SampleCollector extends Model
{
    use HasFactory;

    protected $fillable = [
        "name",
        "email",
    ];

    public function collectRequests(): HasMany
    {
        return $this->hasMany(CollectRequest::class);
    }
}
