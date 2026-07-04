<?php

namespace App\Domains\Laboratory\Models;

use App\Domains\Reception\Models\ReportParameter;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property int $report_template_id
 * @property string $title
 * @property string $type
 * @property bool $required
 * @property bool $active
 * @property array<array-key, mixed>|null $custom_props
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class ReportTemplateParameter extends Model
{
    use Searchable;

    protected $fillable = [
        "report_template_id",
        "type",
        "title",
        "custom_props",
        "active",
        "required"
    ];

    protected $casts = [
        "custom_props" => "json",
        "active" => "boolean",
        "required" => "boolean"
    ];

    protected $appends=[
        "element"
    ];

    public function getElementAttribute(): string
    {
        return Str::slug($this->title,'_').'_'.$this->id;
    }

    /** @return BelongsTo<ReportTemplate, $this> */
    public function reportTemplate(): BelongsTo
    {
        return $this->belongsTo(ReportTemplate::class);
    }

    /** @return HasMany<ReportParameter, $this> */
    public function reportParameters(): HasMany
    {
        return $this->hasMany(ReportParameter::class);
    }

}
