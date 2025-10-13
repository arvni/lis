<?php

namespace App\Domains\Laboratory\Models;

use App\Domains\Laboratory\Enums\MethodPriceType;
use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Referrer\Models\ReferrerTest;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Test extends Model
{
    use Searchable;

    protected $fillable = [
        "name",
        "code",
        "fullName",
        "description",
        "status",
        "type",
        "price",
        "referrer_price",
        "price_type",
        "referrer_price_type",
        "extra",
        "referrer_extra",
        "consent_form_id",
        "request_form_id",
        "instruction_id",
        "can_merge"
    ];

    protected $searchable = [
        "name",
        "code",
        "fullName"
    ];

    protected $casts = [
        "status" => "boolean",
        "type" => TestType::class,
        "price" => "decimal:3",
        "referrer_price" => "decimal:3",
        "price_type" => MethodPriceType::class,
        "referrer_price_type" => MethodPriceType::class,
        'extra' => 'json',
        'referrer_extra' => 'json',
    ];

    public function testGroup(): BelongsTo
    {
        return $this->belongsTo(TestGroup::class);
    }

    public function testGroups(): BelongsToMany
    {
        return $this->belongsToMany(TestGroup::class, "test_group_test");
    }


    public function acceptanceItems()
    {
        return $this->hasManyThrough(AcceptanceItem::class, MethodTest::class, "test_id", "method_test_id");
    }

    public function reportTemplates(): BelongsToMany
    {
        return $this->belongsToMany(ReportTemplate::class);
    }

    public function sampleTypeTests()
    {
        return $this->hasMany(SampleTypeTest::class);
    }

    public function sampleTypes(): BelongsToMany
    {
        return $this->belongsToMany(SampleType::class, "sample_type_tests")
            ->withPivot(["description", "defaultType"]);
    }

    public function methods(): BelongsToMany
    {
        return $this->belongsToMany(Method::class, "method_tests")
            ->withPivot(["is_default"]);
    }

    public function methodTests()
    {
        return $this->hasMany(MethodTest::class);
    }

    public function offers(): BelongsToMany
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

    public function requestForm(): BelongsTo
    {
        return $this->belongsTo(RequestForm::class);
    }

    public function consentForm(): BelongsTo
    {
        return $this->belongsTo(ConsentForm::class);
    }

    public function instruction(): BelongsTo
    {
        return $this->belongsTo(Instruction::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', true);
    }
}
