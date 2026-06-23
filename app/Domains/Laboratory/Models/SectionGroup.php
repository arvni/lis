<?php

namespace App\Domains\Laboratory\Models;

use App\Domains\Reception\Enums\AcceptanceItemStateStatus;
use App\Domains\Reception\Models\AcceptanceItemState;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

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

    public function scopeHaveChildren($query)
    {
        return $query->has("sections")->orHas("Children");
    }

    public function scopeActive($query)
    {
        return $query->where("active", true);
    }

    public function scopeWithoutParent($query)
    {
        return $query->whereDoesntHave("parent");
    }

    public function scopeWithoutChildren($query)
    {
        return $query->whereDoesntHave("children");
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


}
