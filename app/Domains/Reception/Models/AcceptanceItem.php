<?php

namespace App\Domains\Reception\Models;

use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Models\InvoiceItem;
use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\Method;
use App\Domains\Laboratory\Models\MethodTest;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Reception\Enums\AcceptanceItemStateStatus;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Referrer\Models\Referrer;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Staudenmeir\EloquentHasManyDeep\HasRelationships;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;
use Illuminate\Database\Eloquent\Builder;

/**
 * @property int $id
 * @property int $acceptance_id
 * @property int|null $method_test_id
 * @property string|null $panel_id
 * @property int|null $invoice_item_id
 * @property numeric $price
 * @property numeric $discount
 * @property int $no_sample
 * @property bool $reportless
 * @property bool $sampleless
 * @property bool $is_pooling
 * @property array<array-key, mixed>|null $timeline
 * @property array<array-key, mixed>|null $customParameters
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 */
class AcceptanceItem extends Model
{
    use HasRelationships, SoftDeletes;

    protected $fillable = [
        'acceptance_id',
        'method_test_id',
        'price',
        'discount',
        'timeline',
        'customParameters',
        'panel_id',
        'invoice_item_id',
        'no_sample',
        'reportless',
        'sampleless',
        'is_pooling',
    ];
    protected $casts = [
        "customParameters" => "json",
        "timeline" => "json",
        "reportless" => "boolean",
        "sampleless" => "boolean",
        "is_pooling" => "boolean",
    ];
    protected $appends = [
        "status",
        "deleted"
    ];

    public function getDeletedAttribute(): bool
    {
        return (bool)$this->deleted_at;
    }

    public function getStatusAttribute(): string
    {
        $this->loadMissing("report", "latestState.section:name,id");
        if ($this->report) {
            if ($this->report->publisher_id)
                return "Report Published";
            elseif ($this->report->approver_id)
                return "Report Approved";
            else
                return "Report Waiting For Approve";
        } elseif ($this->latestState) {
            if ($this->latestState?->status === AcceptanceItemStateStatus::FINISHED) {
                return "Waiting For Report";
            } else {
                return ucfirst($this->latestState?->status?->value) . " in " . $this->latestState?->section?->name;
            }
        }
        return "-";
    }

    /** @return BelongsTo<Acceptance, $this> */
    public function acceptance(): BelongsTo
    {
        return $this->belongsTo(Acceptance::class);
    }

    /** @return MorphToMany<Tag, $this> */
    public function tags(): MorphToMany
    {
        return $this->morphToMany(Tag::class, 'taggable')->withTimestamps();
    }

    /** @return BelongsTo<MethodTest, $this> */
    public function methodTest(): BelongsTo
    {
        return $this->belongsTo(MethodTest::class);
    }

    /** @return BelongsTo<Test, $this> */
    public function panelTest(): BelongsTo
    {
        return $this->belongsTo(Test::class, 'panel_id');
    }

    /** @return HasOneThrough<Method, MethodTest, $this> */
    public function method(): HasOneThrough
    {
        return $this->hasOneThrough(Method::class, MethodTest::class, "id", "id", "method_test_id", "method_id");
    }

    /** @return HasOneThrough<Test, MethodTest, $this> */
    public function test(): HasOneThrough
    {
        return $this->hasOneThrough(Test::class, MethodTest::class, "id", "id", "method_test_id", "test_id");
    }

    /** @return BelongsToMany<Patient, $this> */
    public function patients(): BelongsToMany
    {
        return $this->belongsToMany(Patient::class, "acceptance_item_patient")
            ->withPivot("order", "main");
    }

    /** @return HasOneThrough<Patient, AcceptanceItemPatient, $this> */
    public function patient(): HasOneThrough
    {
        return $this->hasOneThrough(
            Patient::class,
            AcceptanceItemPatient::class,
            "acceptance_item_id",
            "id", "id",
            "patient_id"
        )
            ->where("main", true);
    }

    public function workflow()
    {
        return $this->hasOneDeepFromRelations(
            $this->methodTest(),        // AcceptanceItem → MethodTest
            (new MethodTest)->method(), // MethodTest → Method
            (new Method)->workflow()    // Method → Workflow
        );
    }

    /** @return HasOneThrough<Invoice, Acceptance, $this> */
    public function invoice(): HasOneThrough
    {
        return $this->hasOneThrough(Invoice::class, Acceptance::class, "id", "id", "acceptance_id", "invoice_id");
    }

    /** @return BelongsTo<InvoiceItem, $this> */
    public function invoiceItem(): BelongsTo
    {
        return $this->belongsTo(InvoiceItem::class);
    }

    /** @return HasOneThrough<Referrer, Acceptance, $this> */
    public function referrer(): HasOneThrough
    {
        return $this->hasOneThrough(Referrer::class, Acceptance::class, "id", "id", "acceptance_id", "referrer_id");
    }

    /** @return HasMany<AcceptanceItemState, $this> */
    public function acceptanceItemStates(): HasMany
    {
        return $this->hasMany(AcceptanceItemState::class);
    }

    /** @return HasOne<AcceptanceItemState, $this> */
    public function latestState(): HasOne
    {
        return $this->hasOne(AcceptanceItemState::class)->latest();
    }

    /** @return BelongsToMany<Sample, $this> */
    public function samples(): BelongsToMany
    {
        return $this->belongsToMany(Sample::class, "acceptance_item_samples")
            ->withPivot("active");
    }

    /** @return BelongsToMany<Sample, $this> */
    public function activeSamples(): BelongsToMany
    {
        return $this->samples()->wherePivot("active", true);
    }

    /** @return HasMany<AcceptanceItemSample, $this> */
    public function acceptanceItemSamples(): HasMany
    {
        return $this->hasMany(AcceptanceItemSample::class);
    }

    /** @return HasOneThrough<Sample, AcceptanceItemSample, $this> */
    public function activeSample(): HasOneThrough
    {
        return $this->hasOneThrough(
            Sample::class,
            AcceptanceItemSample::class,
            'acceptance_item_id', // foreign key on pivot
            'id', // primary key on Sample
            'id', // local key on current model
            'sample_id' // foreign key on pivot
        )
            ->where('acceptance_item_samples.active', true);
    }

    /** @return HasMany<Report, $this> */
    public function reports(): HasMany
    {
        return $this->hasMany(Report::class);
    }

    /** @return HasOne<Report, $this> */
    public function report(): HasOne
    {
        return $this->hasOne(Report::class)
            ->where("status", true);
    }

    /**
     * @param  Builder<AcceptanceItem>  $query
     */
    public function scopeIsTest(Builder $query): void
    {
        $query->whereHas("method", function ($q) {
            $q->whereHas("test", fn($q) => $q->where("tests.type", TestType::TEST));
        });
    }


    /**
     * @param  Builder<AcceptanceItem>  $query
     * @return Builder<AcceptanceItem>
     */
    public function scopeReportLess(Builder $query): Builder
    {
        return $query
            ->where("reportless", false)
            ->whereHas("latestState", function ($q) {
                $q->where("status", AcceptanceItemStateStatus::FINISHED);
            })
            ->whereDoesntHave("acceptanceItemStates", function ($q) {
                $q->whereIn("status", [AcceptanceItemStateStatus::WAITING, AcceptanceItemStateStatus::PROCESSING]);
            })
            ->whereRaw("(select count(*) from `samples`
    inner join `acceptance_item_samples` on `samples`.`id` = `acceptance_item_samples`.`sample_id`
    where `acceptance_items`.`id` = `acceptance_item_samples`.`acceptance_item_id`
    and `acceptance_item_samples`.`active` = 1
) >= `acceptance_items`.`no_sample`")
            ->whereHas("acceptance", function ($q) {
                $q->whereIn("status", [AcceptanceStatus::PROCESSING]);
            })
            ->whereDoesntHave("reports", function ($q) {
                $q->where("status", true);
            });
    }

}
