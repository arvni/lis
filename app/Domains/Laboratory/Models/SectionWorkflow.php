<?php

namespace App\Domains\Laboratory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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


    /** @return BelongsTo<Section, $this> */
    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    /** @return BelongsTo<Workflow, $this> */
    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }
}
