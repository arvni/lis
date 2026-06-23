<?php

namespace App\Domains\Laboratory\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

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

    /** @return BelongsToMany<Test, $this> */
    public function Tests(): BelongsToMany
    {
        return $this->belongsToMany(Test::class);
    }
}
