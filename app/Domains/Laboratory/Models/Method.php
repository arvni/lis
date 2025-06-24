<?php

namespace App\Domains\Laboratory\Models;

use App\Domains\Laboratory\Enums\MethodPriceType;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;

class Method extends Model
{
    use Searchable;
    protected $fillable = [
        "id",
        "name",
        "turnaround_time",
        "status",
        "price",
        "price_type",
        "extra",
        "referrer_price",
        "referrer_price_type",
        "referrer_extra",
        "barcode_group_id",
        "workflow_id",
        "no_patient"
    ];

    protected $casts = [
        "price" => "float",
        "referrer_price" => "decimal:2",
        "status" => "boolean",
        "extra"=>"json",
        "referrer_extra"=>"json",
        "price_type" => MethodPriceType::class,
        "referrer_price_type" => MethodPriceType::class,
    ];

    public function acceptanceItems()
    {
        return $this->hasManyThrough(AcceptanceItem::class,MethodTest::class,"method_id","method_test_id");
    }

    public function tests()
    {
        return $this->belongsToMany(Test::class, "method_tests")
            ->withPivot(["is_default","status"]);
    }

    public function test()
    {
        return $this->hasOneThrough(Test::class, MethodTest::class, "method_id", "id", "id", "test_id")
            ->where("is_default", true);
    }

    public function methodTests()
    {
        return $this->hasMany(MethodTest::class);
    }

    public function workflow()
    {
        return $this->belongsTo(Workflow::class);
    }

    public function barcodeGroup()
    {
        return $this->belongsTo(BarcodeGroup::class);
    }


    public function scopeActive($query)
    {
        return $query->where("status", true);
    }
}
