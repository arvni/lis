<?php

namespace App\Domains\Laboratory\Models;

use Illuminate\Database\Eloquent\Model;

class RequestForm extends Model
{
    protected $searchable = [
        "name"
    ];

    protected $fillable = [
        "name",
        "file",
        "formData"
    ];

    protected $casts = [
        "formData" => "json"
    ];

    public function tests()
    {
        return $this->hasMany(Test::class);
    }
}
