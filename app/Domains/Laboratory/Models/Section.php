<?php

namespace App\Domains\Laboratory\Models;

use App\Domains\Reception\Enums\AcceptanceItemStateStatus;
use App\Domains\Reception\Models\AcceptanceItemState;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;

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


    public function workflows()
    {
        return $this->belongsToMany(Workflow::class, "section_workflows")
            ->withPivot("order", "parameters", "id")
            ->withTimestamps()
            ->orderByPivot('order');
    }

    public function sectionWorkflows()
    {
        return $this->hasMany(SectionWorkflow::class);
    }

    public function acceptanceItemStates()
    {
        return $this->hasMany(AcceptanceItemState::class);
    }

    public function sectionGroup()
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
