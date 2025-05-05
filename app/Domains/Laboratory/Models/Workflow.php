<?php

namespace App\Domains\Laboratory\Models;

use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;

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

    public function methods()
    {
        return $this->hasMany(Method::class);
    }

    public function sections()
    {
        return $this->belongsToMany(Section::class,"section_workflows")
            ->withPivot("order", "parameters", "id")
            ->withTimestamps()
            ->orderByPivot('order');
    }

    public function sectionWorkflows()
    {
        return $this->hasMany(SectionWorkflow::class);
    }

    public function firstSection()
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

    public function lastSection()
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
