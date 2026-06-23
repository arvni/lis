<?php

namespace App\Domains\Inventory\Models;

use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Unit extends Model
{
    use SoftDeletes, Searchable;

    protected $searchable = ['name', 'abbreviation'];

    protected $fillable = ['name', 'abbreviation', 'description'];

    /** @return HasMany<ItemUnitConversion, $this> */
    public function itemConversions(): HasMany
    {
        return $this->hasMany(ItemUnitConversion::class);
    }
}
