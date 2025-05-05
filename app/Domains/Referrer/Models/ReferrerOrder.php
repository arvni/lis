<?php

namespace App\Domains\Referrer\Models;

use App\Domains\Document\Models\Document;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Patient;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Model;

class ReferrerOrder extends Model
{
    protected $fillable = [
        "orderInformation",
        "status",
        "reference_no",
        "order_id",
        "logisticInformation",
        "received_at",
    ];

    protected $casts = [
        "orderInformation" => "json",
        "logisticInformation" => "json",
        "received_at" => "datetime",
    ];

    public function ownedDocuments()
    {
        return $this->morphMany(Document::class, "owner");
    }

    public function referrer()
    {
        return $this->belongsTo(Referrer::class);
    }

    public function acceptance()
    {
        return $this->belongsTo(Acceptance::class);
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function acceptanceItems()
    {
        return $this->hasManyThrough(AcceptanceItem::class, Acceptance::class);
    }

    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where("order_id", "like", "%$search%")
                ->orwhereHas("Patient", function ($qu) use ($search) {
                    $qu->search($search);
                })
                ->orWhereHas("Patient", function ($qu) use ($search) {
                    $qu->whereHas("Samples", function ($que) use ($search) {
                        $que->where("barcode", "like", "%$search%");
                    });
                });
        });
    }
}
