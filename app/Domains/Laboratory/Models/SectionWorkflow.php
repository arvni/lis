<?php

namespace App\Domains\Laboratory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $section_id
 * @property int $workflow_id
 * @property int $order
 * @property array<array-key, mixed> $parameters
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
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
