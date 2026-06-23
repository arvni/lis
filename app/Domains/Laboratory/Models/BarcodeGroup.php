<?php

namespace App\Domains\Laboratory\Models;


use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BarcodeGroup extends Model
{
    use HasFactory,Searchable;
    protected $fillable=[
        "name",
        "abbr"
    ];

    /** @return HasMany<Method, $this> */
    public function methods(): HasMany
    {
        return $this->hasMany(Method::class);
    }
}
