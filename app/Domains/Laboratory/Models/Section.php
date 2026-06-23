<?php

namespace App\Domains\Laboratory\Models;

use App\Domains\Reception\Enums\AcceptanceItemStateStatus;
use App\Domains\Reception\Models\AcceptanceItemState;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Aggregate counts populated by withCount([...]) in SectionGroupService (not DB columns).
 *
 * @property-read int|null $waiting_items_count
 * @property-read int|null $processing_items_count
 * @property-read int|null $finished_items_count
 * @property-read int|null $rejected_items_count
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

    public function scopeIsActive($query)
    {
        return $query->where("active", true);
    }

    public function waitingItems()
    {
        return $this->acceptanceItemStates()->where("status",AcceptanceItemStateStatus::WAITING);
    }
    public function processingItems()
    {
        return $this->acceptanceItemStates()->where("status",AcceptanceItemStateStatus::PROCESSING);
    }
    public function finishedItems()
    {
        return $this->acceptanceItemStates()->where("status",AcceptanceItemStateStatus::FINISHED);
    }
    public function rejectedItems()
    {
        return $this->acceptanceItemStates()->where("status",AcceptanceItemStateStatus::REJECTED);
    }

    public function scopeActive($query)
    {
        return $query->where("active", true);
    }

}
