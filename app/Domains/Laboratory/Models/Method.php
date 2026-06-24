<?php

namespace App\Domains\Laboratory\Models;

use App\Domains\Laboratory\Enums\MethodPriceType;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;
use Illuminate\Database\Eloquent\Builder;

/**
 * @property int $id
 * @property int|null $workflow_id
 * @property int|null $barcode_group_id
 * @property string $name
 * @property int|null $turnaround_time
 * @property float $price
 * @property numeric $referrer_price
 * @property \App\Domains\Laboratory\Enums\MethodPriceType $price_type
 * @property \App\Domains\Laboratory\Enums\MethodPriceType $referrer_price_type
 * @property array<array-key, mixed>|null $referrer_extra
 * @property bool $status
 * @property array<array-key, mixed>|null $extra
 * @property int $no_patient
 * @property int $no_sample
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
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
        "no_patient",
        "no_sample",
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

    /** @return HasManyThrough<AcceptanceItem, MethodTest, $this> */
    public function acceptanceItems(): HasManyThrough
    {
        return $this->hasManyThrough(AcceptanceItem::class,MethodTest::class,"method_id","method_test_id");
    }

    /** @return BelongsToMany<Test, $this> */
    public function tests(): BelongsToMany
    {
        return $this->belongsToMany(Test::class, "method_tests")
            ->withPivot(["is_default","status"]);
    }

    /** @return HasOneThrough<Test, MethodTest, $this> */
    public function test(): HasOneThrough
    {
        return $this->hasOneThrough(Test::class, MethodTest::class, "method_id", "id", "id", "test_id")
            ->where("is_default", true);
    }

    /** @return HasMany<MethodTest, $this> */
    public function methodTests(): HasMany
    {
        return $this->hasMany(MethodTest::class);
    }

    /** @return BelongsTo<Workflow, $this> */
    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }

    /** @return BelongsTo<BarcodeGroup, $this> */
    public function barcodeGroup(): BelongsTo
    {
        return $this->belongsTo(BarcodeGroup::class);
    }


    /**
     * @param  Builder<Method>  $query
     * @return Builder<Method>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where("status", true);
    }
}
