<?php

namespace App\Domains\Referrer\Models;

use App\Domains\Laboratory\Models\Test;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReferrerTest extends Model
{
    use HasFactory;

    protected $fillable = [
        "referrer_id",
        "test_id",
        "price",
        "methods"
    ];

    protected $casts = [
        "methods" => "json",
    ];

    public function test()
    {
        return $this->belongsTo(Test::class);
    }

    public function referrer()
    {
        return $this->belongsTo(Referrer::class);
    }
}
