<?php

namespace App\Domains\Reception\Models;

use App\Domains\Billing\Models\Invoice;
use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\Method;
use App\Domains\Laboratory\Models\MethodTest;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Reception\Enums\AcceptanceItemStateStatus;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Referrer\Models\Referrer;
use Illuminate\Database\Eloquent\Model;
use Staudenmeir\EloquentHasManyDeep\HasRelationships;

class AcceptanceItem extends Model
{
    use HasRelationships;

    protected $fillable = [
        'acceptance_id',
        'method_test_id',
        'price',
        'discount',
        'timeline',
        'customParameters',
    ];
    protected $casts = [
        "customParameters" => "json",
        "timeline" => "json"
    ];
    protected $appends = [
        "status"
    ];

    public function getStatusAttribute()
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

    public function acceptance()
    {
        return $this->belongsTo(Acceptance::class);
    }

    public function methodTest()
    {
        return $this->belongsTo(MethodTest::class);
    }

    public function method()
    {
        return $this->hasOneThrough(Method::class, MethodTest::class, "id", "id", "method_test_id", "method_id");
    }

    public function test()
    {
        return $this->hasOneThrough(Test::class, MethodTest::class, "id", "id", "method_test_id", "test_id");
    }

    public function patients()
    {
        return $this->belongsToMany(Patient::class, "acceptance_item_patient")
            ->withPivot("order", "main");
    }

    public function patient()
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

    public function invoice()
    {
        return $this->hasOneThrough(Invoice::class, Acceptance::class, "id", "id", "acceptance_id", "invoice_id");
    }

    public function referrer()
    {
        return $this->hasOneThrough(Referrer::class, Acceptance::class, "id", "id", "acceptance_id", "referrer_id");
    }

    public function acceptanceItemStates()
    {
        return $this->hasMany(AcceptanceItemState::class);
    }

    public function latestState()
    {
        return $this->hasOne(AcceptanceItemState::class)->latest();
    }

    public function samples()
    {
        return $this->belongsToMany(Sample::class, "acceptance_item_samples")
            ->withPivot("active");
    }

    public function activeSamples()
    {
        return $this->samples()->wherePivot("active", true);
    }

    public function acceptanceItemSamples()
    {
        return $this->hasMany(AcceptanceItemSample::class);
    }

    public function activeSample()
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

    public function reports()
    {
        return $this->hasMany(Report::class);
    }

    public function report()
    {
        return $this->hasOne(Report::class)
            ->where("status", true);
    }

    public function scopeIsTest($query)
    {
        $query->whereHas("method", function ($q) {
            $q->whereHas("test", fn($q) => $q->where("tests.type", TestType::TEST));
        });
    }


    public function scopeReportLess($query)
    {
        return $query
            ->whereHas("latestState", function ($q) {
                $q->where("status", AcceptanceItemStateStatus::FINISHED);
            })
            ->whereDoesntHave("acceptanceItemStates", function ($q) {
                $q->whereIn("status", [AcceptanceItemStateStatus::WAITING, AcceptanceItemStateStatus::PROCESSING]);
            })
            ->whereHas("samples", function ($q) {
                $q->where("acceptance_item_samples.active", true);
            })
            ->whereHas("acceptance", function ($q) {
                $q->whereIn("status", [AcceptanceStatus::PROCESSING]);
            })
            ->whereDoesntHave("reports", function ($q) {
                $q->where("status", true);
            });
    }

}
