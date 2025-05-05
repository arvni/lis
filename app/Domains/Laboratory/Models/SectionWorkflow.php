<?php

namespace App\Domains\Laboratory\Models;

use Illuminate\Database\Eloquent\Model;

class SectionWorkflow extends Model
{
    protected $fillable = [
        "section_id",
        "workflow_id",
        "parameters",
        "order",
    ];

    protected $casts=[
        "parameters"=>"json"
    ];


    public function section()
    {
        return $this->belongsTo(Section::class);
    }

    public function workflow()
    {
        return $this->belongsTo(Workflow::class);
    }
}
