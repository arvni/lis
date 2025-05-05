<?php

namespace App\Domains\Setting\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{

    protected $fillable = [
        'title',
        'key',
        'class',
        'value',
    ];

    protected $casts = [
        'value' => 'json', // If the value is stored as JSON
    ];
}
