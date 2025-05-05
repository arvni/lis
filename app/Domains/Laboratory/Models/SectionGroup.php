<?php

namespace App\Domains\Laboratory\Models;

use App\Domains\Reception\Enums\AcceptanceItemStateStatus;
use App\Domains\Reception\Models\AcceptanceItemState;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;

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

    public function children()
    {
        return $this->hasMany(SectionGroup::class, "section_group_id");
    }

    public function recursiveChildren()
    {
        return $this->children()->with(['sections', 'recursiveChildren']);
    }

    public function parent()
    {
        return $this->belongsTo(SectionGroup::class, "section_group_id");
    }

    public function sections()
    {
        return $this->hasMany(Section::class);
    }

    public function acceptanceItemStates()
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
