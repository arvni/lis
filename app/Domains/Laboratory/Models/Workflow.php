<?php

namespace App\Domains\Laboratory\Models;

use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;

/**
 * @property int $id
 * @property string $name
 * @property string|null $description
 * @property bool $status
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class Workflow extends Model
{
    use Searchable;
    protected $fillable = [
        "name",
        "description",
        "status"
    ];

    protected $casts = [
        "status" => "boolean"
    ];

    /** @return HasMany<Method, $this> */
    public function methods(): HasMany
    {
        return $this->hasMany(Method::class);
    }

    /** @return BelongsToMany<Section, $this> */
    public function sections(): BelongsToMany
    {
        return $this->belongsToMany(Section::class,"section_workflows")
            ->withPivot("order", "parameters", "id")
            ->withTimestamps()
            ->orderByPivot('order');
    }

    /** @return HasMany<SectionWorkflow, $this> */
    public function sectionWorkflows(): HasMany
    {
        return $this->hasMany(SectionWorkflow::class);
    }

    /** @return HasOneThrough<Section, SectionWorkflow, $this> */
    public function firstSection(): HasOneThrough
    {
        return $this->hasOneThrough(
            Section::class,
            SectionWorkflow::class,
            'workflow_id',
            'id',
            'id',
            'section_id'
        )
            ->where('section_workflows.order', 0)
            ->withAggregate('sectionWorkflows as section_workflows_order', '`order`')
            ->withAggregate('sectionWorkflows as section_workflows_parameters', 'parameters');
    }

    /** @return HasOneThrough<Section, SectionWorkflow, $this> */
    public function lastSection(): HasOneThrough
    {
        return $this->hasOneThrough(
            Section::class,           // Final model
            SectionWorkflow::class,   // Intermediate model
            'workflow_id',            // Foreign key on SectionWorkflow
            'id',                     // Local key on Section
            'id',                     // Local key on Workflow
            'section_id'              // Foreign key on SectionWorkflow to Section
        )
            ->withAggregate('sectionWorkflows as section_workflows_order', 'order',)
            ->withAggregate('sectionWorkflows as section_workflows_parameters', 'parameters')
            ->orderBy("order", "desc");
    }
}
