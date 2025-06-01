<?php

namespace App\Domains\Laboratory\Models;

use App\Domains\Reception\Models\AcceptanceItem;
use Illuminate\Database\Eloquent\Model;

class MethodTest extends Model
{

    protected $fillable = [
        "method_id",
        "test_id",
        "is_default",
        "status"
    ];

    protected $casts = [
        "status" => "boolean",
        "is_default" => "boolean"
    ];

    public function method()
    {
        return $this->belongsTo(Method::class);
    }

    public function test()
    {
        return $this->belongsTo(Test::class);
    }

    public function acceptanceItems()
    {
        return $this->hasMany(AcceptanceItem::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', true);
    }

}
