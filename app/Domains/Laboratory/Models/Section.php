<?php

namespace App\Domains\Laboratory\Models;

use App\Domains\Reception\Enums\AcceptanceItemStateStatus;
use App\Domains\Reception\Models\AcceptanceItemState;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

/**
 * Aggregate counts populated by withCount([...]) in SectionGroupService (not DB columns).
 *
 * @property-read int|null $waiting_items_count
 * @property-read int|null $processing_items_count
 * @property-read int|null $finished_items_count
 * @property-read int|null $rejected_items_count
 * @property int $id
 * @property int $section_group_id
 * @property string $name
 * @property string|null $icon
 * @property string|null $description
 * @property bool $active
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class Section extends Model
{
    use Searchable;

    protected $fillable = [
        "name",
        "active",
        "description",
        "section_group_id",
        "icon"
    ];

    protected $casts = [
        "active" => "boolean"
    ];

    protected $with = ["sectionGroup"];


    /** @return BelongsToMany<Workflow, $this> */
    public function workflows(): BelongsToMany
    {
        return $this->belongsToMany(Workflow::class, "section_workflows")
            ->withPivot("order", "parameters", "id")
            ->withTimestamps()
            ->orderByPivot('order');
    }

    /** @return HasMany<SectionWorkflow, $this> */
    public function sectionWorkflows(): HasMany
    {
        return $this->hasMany(SectionWorkflow::class);
    }

    /** @return HasMany<AcceptanceItemState, $this> */
    public function acceptanceItemStates(): HasMany
    {
        return $this->hasMany(AcceptanceItemState::class);
    }

    /** @return BelongsTo<SectionGroup, $this> */
    public function sectionGroup(): BelongsTo
    {
        return $this->belongsTo(SectionGroup::class);
    }

    /**
     * @param  Builder<Section>  $query
     * @return Builder<Section>
     */
    public function scopeIsActive(Builder $query): Builder
    {
        return $query->where("active", true);
    }

    /** @return HasMany<AcceptanceItemState, $this> */
    public function waitingItems(): HasMany
    {
        return $this->acceptanceItemStates()->where("status",AcceptanceItemStateStatus::WAITING);
    }
    /** @return HasMany<AcceptanceItemState, $this> */
    public function processingItems(): HasMany
    {
        return $this->acceptanceItemStates()->where("status",AcceptanceItemStateStatus::PROCESSING);
    }
    /** @return HasMany<AcceptanceItemState, $this> */
    public function finishedItems(): HasMany
    {
        return $this->acceptanceItemStates()->where("status",AcceptanceItemStateStatus::FINISHED);
    }
    /** @return HasMany<AcceptanceItemState, $this> */
    public function rejectedItems(): HasMany
    {
        return $this->acceptanceItemStates()->where("status",AcceptanceItemStateStatus::REJECTED);
    }

    /**
     * @param  Builder<Section>  $query
     * @return Builder<Section>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where("active", true);
    }

}
