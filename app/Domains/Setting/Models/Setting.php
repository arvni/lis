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
        'value' => 'json',
    ];

    public function toArray(): array
    {
        $array = parent::toArray();
        if (($array['value']['type'] ?? null) === 'password') {
            $array['value']['value'] = '';
        }
        return $array;
    }
}
