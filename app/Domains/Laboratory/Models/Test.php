<?php

namespace App\Domains\Laboratory\Models;

use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Referrer\Models\ReferrerTest;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;

class Test extends Model
{
    use Searchable;

    protected $fillable = [
        "name",
        "code",
        "fullName",
        "description",
        "status",
        "test_group_id",
        "type",
        "price"
    ];

    protected $searchable = [
        "name",
        "code",
        "fullName"
    ];

    protected $casts = [
        "status" => "boolean",
        "type" => TestType::class,
        "price" => "decimal:3"
    ];

    public function testGroup()
    {
        return $this->belongsTo(TestGroup::class);
    }


    public function acceptanceItems()
    {
        return $this->hasManyThrough(AcceptanceItem::class, MethodTest::class, "test_id", "method_test_id");
    }

    public function reportTemplates()
    {
        return $this->belongsToMany(ReportTemplate::class);
    }

    public function sampleTypeTests()
    {
        return $this->hasMany(SampleTypeTest::class);
    }

    public function sampleTypes()
    {
        return $this->belongsToMany(SampleType::class, "sample_type_tests")
            ->withPivot(["description", "defaultType"]);
    }

    public function methods()
    {
        return $this->belongsToMany(Method::class, "method_tests")
            ->withPivot(["is_default"]);
    }

    public function methodTests()
    {
        return $this->hasMany(MethodTest::class);
    }

    public function offers()
    {
        return $this->belongsToMany(Offer::class, "offer_test");
    }

    public function referrerTests()
    {
        return $this->hasMany(ReferrerTest::class);
    }

    public function referrerTest()
    {
        return $this->hasOne(ReferrerTest::class);
    }

    public function requestForm()
    {
        return $this->belongsTo(RequestForm::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', true);
    }
}
