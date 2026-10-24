<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Models;

use App\Domains\Document\Models\Document;
use App\Domains\Laboratory\Models\Test;
use App\Domains\PreOrder\Enums\ActionOwner;
use App\Domains\PreOrder\Enums\PreOrderStage;
use App\Domains\PreOrder\Enums\StartMode;
use App\Domains\Referrer\Models\Referrer;
use App\Domains\Referrer\Models\ReferrerOrder;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $code
 * @property int $referrer_id
 * @property int|null $assigned_to
 * @property int|null $main_test_id
 * @property int|null $flow_id
 * @property list<array<string, mixed>>|null $flow_stages
 * @property int|null $flow_version
 * @property PreOrderStage $stage
 * @property ActionOwner $action_owner
 * @property Carbon|null $stage_entered_at
 * @property array<string, mixed>|null $exception
 * @property StartMode $start_mode
 * @property string|null $start_hint
 * @property string|null $referral_reason
 * @property list<array<string, mixed>> $patients
 * @property string|null $main_patient_ref
 * @property array<string, mixed>|null $scope
 * @property array<string, mixed>|null $clinical
 * @property array<string, mixed>|null $created_by
 * @property Carbon|null $submitted_at
 * @property Carbon|null $closed_at
 * @property int $version
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class PreOrder extends Model
{
    protected $fillable = [
        'code', 'referrer_id', 'assigned_to', 'main_test_id', 'flow_id', 'flow_stages', 'flow_version',
        'stage', 'action_owner', 'stage_entered_at', 'exception', 'start_mode', 'start_hint',
        'referral_reason', 'patients', 'main_patient_ref', 'scope', 'clinical', 'created_by',
        'submitted_at', 'closed_at', 'version',
    ];

    protected $casts = [
        'flow_stages' => 'array',
        'stage' => PreOrderStage::class,
        'action_owner' => ActionOwner::class,
        'start_mode' => StartMode::class,
        'stage_entered_at' => 'datetime',
        'exception' => 'array',
        'patients' => 'array',
        'scope' => 'array',
        'clinical' => 'array',
        'created_by' => 'array',
        'submitted_at' => 'datetime',
        'closed_at' => 'datetime',
        'version' => 'integer',
    ];

    /** @return BelongsTo<Referrer, $this> */
    public function referrer(): BelongsTo
    {
        return $this->belongsTo(Referrer::class);
    }

    /** @return BelongsTo<User, $this> */
    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /** @return BelongsTo<Test, $this> */
    public function mainTest(): BelongsTo
    {
        return $this->belongsTo(Test::class, 'main_test_id');
    }

    /** @return BelongsTo<Flow, $this> */
    public function flow(): BelongsTo
    {
        return $this->belongsTo(Flow::class);
    }

    /** @return HasMany<PreOrderItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(PreOrderItem::class);
    }

    /** @return HasMany<PreOrderRequest, $this> */
    public function requests(): HasMany
    {
        return $this->hasMany(PreOrderRequest::class);
    }

    /** @return HasMany<PreOrderHistory, $this> */
    public function histories(): HasMany
    {
        return $this->hasMany(PreOrderHistory::class);
    }

    /** @return HasMany<ReferrerOrder, $this> */
    public function referrerOrders(): HasMany
    {
        return $this->hasMany(ReferrerOrder::class);
    }

    /** @return MorphMany<Document, $this> */
    public function documents(): MorphMany
    {
        return $this->morphMany(Document::class, 'owner');
    }

    public function isClosed(): bool
    {
        return $this->closed_at !== null;
    }

    /**
     * @param  Builder<PreOrder>  $query
     * @return Builder<PreOrder>
     */
    public function scopeSearch(Builder $query, string $search): Builder
    {
        return $query->where(function (Builder $q) use ($search) {
            $q->where('code', 'like', "%$search%")
                ->orWhere('patients', 'like', "%$search%");
        });
    }
}
