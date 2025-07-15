<?php

namespace App\Domains\Laboratory\Models;

use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;

class TestGroup extends Model
{
    use Searchable;
    protected $fillable = [
        "name",
    ];
    protected $searchable = [
      "name"
    ];
    public function tests()
    {
        return $this->belongsToMany(Test::class,"test_group_test");
    }
}
