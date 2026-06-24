<?php

namespace App\Domains\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

/**
 * @property int $id
 * @property string $name
 * @property string|null $description
 * @property bool $is_active
 * @property bool $is_default
 * @property array<array-key, mixed>|null $conditions
 * @property int $priority
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class WorkflowTemplate extends Model
{
    protected $fillable = ['name', 'description', 'is_active', 'is_default', 'conditions', 'priority'];

    protected $casts = [
        'is_active'  => 'boolean',
        'is_default' => 'boolean',
        'conditions' => 'array',
        'priority'   => 'integer',
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
