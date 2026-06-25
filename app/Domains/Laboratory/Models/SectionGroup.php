<?php

namespace App\Domains\Laboratory\Models;

use App\Domains\Reception\Enums\AcceptanceItemStateStatus;
use App\Domains\Reception\Models\AcceptanceItemState;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Builder;

/**
 * @property int $id
 * @property int|null $section_group_id
 * @property string $name
 * @property string|null $icon
 * @property bool $active
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class SectionGroup extends Model
{
    use Searchable;

    protected $fillable = [
        "name",
        "active",
        "section_group_id",
        "icon"
    ];

    protected $casts = [
        "active" => "boolean"
    ];

    protected $with = ["parent"];

    /** @return HasMany<SectionGroup, $this> */
    public function children(): HasMany
    {
        return $this->hasMany(SectionGroup::class, "section_group_id");
    }

    /** @return HasMany<SectionGroup, $this> */
    public function recursiveChildren(): HasMany
    {
        return $this->children()->with(['sections', 'recursiveChildren']);
    }

    /** @return BelongsTo<SectionGroup, $this> */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(SectionGroup::class, "section_group_id");
    }

    /** @return HasMany<Section, $this> */
    public function sections(): HasMany
    {
        return $this->hasMany(Section::class);
    }

    /** @return HasManyThrough<AcceptanceItemState, Section, $this> */
    public function acceptanceItemStates(): HasManyThrough
    {
        return $this->hasManyThrough(AcceptanceItemState::class, Section::class);
    }

    /**
     * @param  Builder<SectionGroup>  $query
     * @return Builder<SectionGroup>
     */
    public function scopeHaveChildren(Builder $query): Builder
    {
        return $query->has("sections")->orHas("Children");
    }

    /**
     * @param  Builder<SectionGroup>  $query
     * @return Builder<SectionGroup>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where("active", true);
    }

    /**
     * @param  Builder<SectionGroup>  $query
     * @return Builder<SectionGroup>
     */
    public function scopeWithoutParent(Builder $query): Builder
    {
        return $query->whereDoesntHave("parent");
    }

    /**
     * @param  Builder<SectionGroup>  $query
     * @return Builder<SectionGroup>
     */
    public function scopeWithoutChildren(Builder $query): Builder
    {
        return $query->whereDoesntHave("children");
    }


    /** @return HasManyThrough<AcceptanceItemState, Section, $this> */
    public function waitingItems(): HasManyThrough
    {
        return $this->acceptanceItemStates()->where("status",AcceptanceItemStateStatus::WAITING);
    }
    /** @return HasManyThrough<AcceptanceItemState, Section, $this> */
    public function processingItems(): HasManyThrough
    {
        return $this->acceptanceItemStates()->where("status",AcceptanceItemStateStatus::PROCESSING);
    }
    /** @return HasManyThrough<AcceptanceItemState, Section, $this> */
    public function finishedItems(): HasManyThrough
    {
        return $this->acceptanceItemStates()->where("status",AcceptanceItemStateStatus::FINISHED);
    }


}
