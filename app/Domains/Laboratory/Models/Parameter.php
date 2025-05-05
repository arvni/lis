<?php

namespace App\Domain\Laboratory\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Parameter extends Model
{
    use HasFactory;
    protected $fillable=[
        "name",
        "class",
        "type",
        "description",
        "condition"
    ];

    protected $casts=[
        "condition"=>"json"
    ];

    public function Tests()
    {
        return $this->belongsToMany(Test::class);
    }
}
