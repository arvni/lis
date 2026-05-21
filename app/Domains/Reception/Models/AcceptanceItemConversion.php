<?php

namespace App\Domains\Reception\Models;

use App\Domains\Laboratory\Models\MethodTest;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Model;

class AcceptanceItemConversion extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'acceptance_item_id',
        'from_method_test_id',
        'to_method_test_id',
        'conversion_type',
        'converted_by',
        'converted_at',
    ];

    protected $casts = [
        'converted_at' => 'datetime',
    ];

    public function acceptanceItem()
    {
        return $this->belongsTo(AcceptanceItem::class);
    }

    public function fromMethodTest()
    {
        return $this->belongsTo(MethodTest::class, 'from_method_test_id');
    }

    public function toMethodTest()
    {
        return $this->belongsTo(MethodTest::class, 'to_method_test_id');
    }

    public function convertedBy()
    {
        return $this->belongsTo(User::class, 'converted_by');
    }
}
