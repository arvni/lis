<?php

namespace App\Domains\Reception\Models;

use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Model;

class Signer extends Model
{
    protected $fillable = [
        "title",
        "name",
        "row",
        "signature",
        "stamp",
    ];

    public function report()
    {
        return $this->belongsTo(Report::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
