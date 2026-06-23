<?php

namespace App\Domains\Reception\Models;

use App\Domains\Laboratory\Models\ReportTemplateParameter;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportParameter extends Model
{
    protected $fillable=[
        "report_id",
        "parameter_id",
        "value"
    ];
    protected $casts=[
        "value"=>"json"
    ];

    /** @return BelongsTo<Report, $this> */
    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class);
    }

    /** @return BelongsTo<ReportTemplateParameter, $this> */
    public function parameter(): BelongsTo
    {
        return $this->belongsTo(ReportTemplateParameter::class);
    }
}
