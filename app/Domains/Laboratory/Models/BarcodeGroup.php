<?php

namespace App\Domains\Laboratory\Models;


use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BarcodeGroup extends Model
{
    use HasFactory,Searchable;
    protected $fillable=[
        "name",
        "abbr"
    ];

    public function methods()
    {
        return $this->hasMany(Method::class);
    }
}
