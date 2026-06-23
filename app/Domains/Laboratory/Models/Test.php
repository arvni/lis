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
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * Runtime flag set by TestController to signal referrer-default pricing during shaping
 * (not a DB column).
 *
 * @property bool $withDefaultReferrerPrice
 */
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

    /** @return BelongsTo<TestGroup, $this> */
    public function testGroup(): BelongsTo
    {
        return $this->belongsTo(TestGroup::class);
    }

    /** @return BelongsToMany<TestGroup, $this> */
    public function testGroups(): BelongsToMany
    {
        return $this->belongsToMany(TestGroup::class, "test_group_test");
    }


    /** @return HasManyThrough<AcceptanceItem, MethodTest, $this> */
    public function acceptanceItems(): HasManyThrough
    {
        return $this->hasManyThrough(AcceptanceItem::class, MethodTest::class, "test_id", "method_test_id");
    }

    /** @return BelongsToMany<ReportTemplate, $this> */
    public function reportTemplates(): BelongsToMany
    {
        return $this->belongsToMany(ReportTemplate::class);
    }

    /** @return HasMany<SampleTypeTest, $this> */
    public function sampleTypeTests(): HasMany
    {
        return $this->hasMany(SampleTypeTest::class);
    }

    /** @return BelongsToMany<SampleType, $this> */
    public function sampleTypes(): BelongsToMany
    {
        return $this->belongsToMany(SampleType::class, "sample_type_tests")
            ->withPivot(["description", "defaultType"]);
    }

    /** @return BelongsToMany<Method, $this> */
    public function methods(): BelongsToMany
    {
        return $this->belongsToMany(Method::class, "method_tests")
            ->withPivot(["is_default"]);
    }

    /** @return HasMany<MethodTest, $this> */
    public function methodTests(): HasMany
    {
        return $this->hasMany(MethodTest::class);
    }

    /** @return BelongsToMany<Offer, $this> */
    public function offers(): BelongsToMany
    {
        return $this->belongsToMany(Offer::class, "offer_test");
    }

    /** @return HasMany<ReferrerTest, $this> */
    public function referrerTests(): HasMany
    {
        return $this->hasMany(ReferrerTest::class);
    }

    /** @return HasOne<ReferrerTest, $this> */
    public function referrerTest(): HasOne
    {
        return $this->hasOne(ReferrerTest::class);
    }

    /** @return BelongsTo<RequestForm, $this> */
    public function requestForm(): BelongsTo
    {
        return $this->belongsTo(RequestForm::class);
    }

    /** @return BelongsTo<ConsentForm, $this> */
    public function consentForm(): BelongsTo
    {
        return $this->belongsTo(ConsentForm::class);
    }

    /** @return BelongsTo<Instruction, $this> */
    public function instruction(): BelongsTo
    {
        return $this->belongsTo(Instruction::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', true);
    }
}
