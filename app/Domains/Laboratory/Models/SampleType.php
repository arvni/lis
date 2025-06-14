<?php

namespace App\Domains\Laboratory\Models;

use App\Domains\Reception\Models\Sample;
use App\Domains\Referrer\Models\Material;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;

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

    public function tests()
    {
        return $this->belongsToMany(Test::class, "sample_type_tests")
            ->withPivot(["description", "defaultType"]);
    }

    public function samples()
    {
        return $this->hasMany(Sample::class);
    }

    public function materials()
    {
        return $this->hasMany(Material::class);
    }
}
