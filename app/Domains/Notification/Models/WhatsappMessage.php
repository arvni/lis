<?php

namespace App\Domains\Notification\Models;

use Illuminate\Database\Eloquent\Model;

class WhatsappMessage extends Model
{
    protected $fillable=[
        'data',
'status',
    ];

    protected $casts=[
        "data"=>"json"
    ];

    public function messageable()
    {
        return $this->morphTo();
    }

}
