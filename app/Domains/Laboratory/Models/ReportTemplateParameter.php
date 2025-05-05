<?php

namespace App\Domains\Laboratory\Models;

use App\Domains\Reception\Models\ReportParameter;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class ReportTemplateParameter extends Model
{
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

    public function getElementAttribute()
    {
        return Str::slug($this->title,'_').'_'.$this->id;
    }

    public function reportTemplate(): BelongsTo
    {
        return $this->belongsTo(ReportTemplate::class);
    }

    public function reportParameters(): HasMany
    {
        return $this->hasMany(ReportParameter::class);
    }

}
