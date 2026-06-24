<?php

namespace App\Domains\Laboratory\Models;

use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

/**
 * @property int $id
 * @property string $name
 * @property string|null $description
 * @property bool $active
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class ApprovalFlow extends Model
{
    use Searchable;

    protected $fillable = [
        "name",
        "description",
        "active",
    ];

    protected $casts = [
        "active" => "boolean",
    ];

    /** @return HasMany<ApprovalFlowStep, $this> */
    public function steps(): HasMany
    {
        return $this->hasMany(ApprovalFlowStep::class)->orderBy("position");
    }

    /** @return HasMany<ReportTemplate, $this> */
    public function reportTemplates(): HasMany
    {
        return $this->hasMany(ReportTemplate::class);
    }

    public function firstStep(): ?ApprovalFlowStep
    {
        return $this->steps()->first();
    }

    public function stepAfter(int $position): ?ApprovalFlowStep
    {
        return $this->steps()->where("position", ">", $position)->first();
    }

    /**
     * @param  Builder<ApprovalFlow>  $query
     * @return Builder<ApprovalFlow>
     */
    public function scopeIsActive(Builder $query): Builder
    {
        return $query->where("active", true);
    }
}
