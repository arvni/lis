<?php

namespace App\Domains\Laboratory\Models;

use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;

class SampleType extends Model
{
    use Searchable;
    protected $fillable = [
        "name",
        "description",
        "orderable"
    ];

    protected $casts=[
        "orderable"=>"boolean"
    ];

    public function tests()
    {
        return $this->belongsToMany(Test::class,"sample_type_tests")
            ->withPivot(["description", "defaultType"]);
    }

    public function samples()
    {
        return $this->hasMany(\App\Domains\Reception\Models\Sample::class);
    }
}
