<?php

namespace App\Domains\Monitoring\Models;

use App\Domains\Laboratory\Models\Section;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property string $node_id
 * @property string|null $name
 * @property string|null $model
 * @property array<array-key, mixed>|null $info
 * @property bool|null $onlined
 * @property int|null $signal_level
 * @property int|null $battery_level
 * @property int|null $section_id
 * @property string|null $notes
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class MonitoringNode extends Model
{
    protected $fillable = [
        'node_id', 'section_id', 'notes',
        'name', 'model', 'info', 'onlined', 'signal_level', 'battery_level',
    ];

    protected $casts = [
        'info'    => 'array',
        'onlined' => 'boolean',
    ];

    /** @return BelongsTo<Section, $this> */
    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }
}
