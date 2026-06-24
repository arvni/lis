<?php

namespace App\Domains\Laboratory\Models;

use App\Domains\Reception\Models\Sample;
use App\Domains\Referrer\Models\Material;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property string|null $description
 * @property bool $orderable
 * @property bool $required_barcode
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class SampleType extends Model
{
    use Searchable;

    protected $fillable = [
        "name",
        "description",
        "orderable",
        "required_barcode"
    ];

    protected $casts = [
        "orderable" => "boolean",
        "required_barcode" => "boolean",
    ];

    /** @return BelongsToMany<Test, $this> */
    public function tests(): BelongsToMany
    {
        return $this->belongsToMany(Test::class, "sample_type_tests")
            ->withPivot(["description", "defaultType"]);
    }

    /** @return HasMany<Sample, $this> */
    public function samples(): HasMany
    {
        return $this->hasMany(Sample::class);
    }

    /** @return HasMany<Material, $this> */
    public function materials(): HasMany
    {
        return $this->hasMany(Material::class);
    }
}
