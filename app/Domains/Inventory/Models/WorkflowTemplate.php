<?php

namespace App\Domains\Inventory\Models;

use App\Domains\Inventory\Enums\WorkflowRequestType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string|null $description
 * @property bool $is_active
 * @property bool $is_default
 * @property WorkflowRequestType|null $request_type
 * @property array<array-key, mixed>|null $conditions
 * @property int $priority
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class WorkflowTemplate extends Model
{
    protected $fillable = ['name', 'description', 'is_active', 'is_default', 'request_type', 'conditions', 'priority'];

    protected $casts = [
        'is_active' => 'boolean',
        'is_default' => 'boolean',
        'request_type' => WorkflowRequestType::class,
        'conditions' => 'array',
        'priority' => 'integer',
    ];

    /** @return HasMany<WorkflowStep, $this> */
    public function steps(): HasMany
    {
        return $this->hasMany(WorkflowStep::class)->orderBy('sort_order');
    }

    /** @return HasMany<PurchaseRequest, $this> */
    public function purchaseRequests(): HasMany
    {
        return $this->hasMany(PurchaseRequest::class);
    }

    /**
     * @param  Builder<WorkflowTemplate>  $query
     * @return Builder<WorkflowTemplate>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
