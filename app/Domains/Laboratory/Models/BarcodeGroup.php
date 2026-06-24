<?php

namespace App\Domains\Laboratory\Models;


use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property string|null $abbr
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
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
