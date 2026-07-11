<?php

namespace App\Domains\Referrer\Models;

use App\Domains\Document\Models\Document;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Patient;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\MorphMany;

/**
 * @property int $id
 * @property int|null $acceptance_id
 * @property int|null $patient_id
 * @property int $referrer_id
 * @property int|null $collect_request_id
 * @property int|null $user_id
 * @property string $order_id
 * @property string $status
 * @property bool $pooling
 * @property bool $needs_add_sample
 * @property array<array-key, mixed> $orderInformation
 * @property array<array-key, mixed>|null $logisticInformation
 * @property string|null $reference_no
 * @property \Illuminate\Support\Carbon|null $received_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class ReferrerOrder extends Model
{
    protected $fillable = [
        "received_at",
        "referrer_id",
        "collect_request_id",
        "order_id",
        "orderInformation",
        "status",
        "pooling",
        "needs_add_sample",
        "reference_no",
        "user_id",
        "logisticInformation",
        "received_at",
        "patient_id",
        "acceptance_id",
    ];

    protected $casts = [
        "orderInformation" => "json",
        "logisticInformation" => "json",
        "received_at" => "datetime",
        "pooling" => "boolean",
        "needs_add_sample" => "boolean",
    ];

    /** @return MorphMany<Document, $this> */
    public function ownedDocuments(): MorphMany
    {
        return $this->morphMany(Document::class, "owner");
    }

    /** @return BelongsTo<Referrer, $this> */
    public function referrer(): BelongsTo
    {
        return $this->belongsTo(Referrer::class);
    }

    /** @return BelongsTo<CollectRequest, $this> */
    public function collectRequest(): BelongsTo
    {
        return $this->belongsTo(CollectRequest::class);
    }

    /** @return BelongsTo<Acceptance, $this> */
    public function acceptance(): BelongsTo
    {
        return $this->belongsTo(Acceptance::class);
    }

    /** @return BelongsTo<Patient, $this> */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasManyThrough<AcceptanceItem, Acceptance, $this> */
    public function acceptanceItems(): HasManyThrough
    {
        return $this->hasManyThrough(AcceptanceItem::class, Acceptance::class);
    }

    /**
     * @param  Builder<ReferrerOrder>  $query
     * @return Builder<ReferrerOrder>
     */
    public function scopeSearch(Builder $query, mixed $search): Builder
    {
        return $query->where(function (Builder $q) use ($search) {
            $q->where("order_id", "like", "%$search%")
                ->orWhereHas("patient", function (Builder $qu) use ($search) {
                    /** @var Builder<Patient> $qu */
                    $qu->search($search);
                })
                ->orWhereHas("patient", function (Builder $qu) use ($search) {
                    $qu->whereHas("samples", function (Builder $que) use ($search) {
                        $que->where("barcode", "like", "%$search%");
                    });
                });
        });
    }
}
