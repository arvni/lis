<?php

namespace App\Domains\Inventory\Models;

use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property string $name
 * @property string $abbreviation
 * @property string|null $description
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 */
class Unit extends Model
{
    use SoftDeletes, Searchable;

    /** @var list<string> */
    protected $searchable = ['name', 'abbreviation'];

    protected $fillable = ['name', 'abbreviation', 'description'];

    /** @return HasMany<ItemUnitConversion, $this> */
    public function itemConversions(): HasMany
    {
        return $this->hasMany(ItemUnitConversion::class);
    }
}
