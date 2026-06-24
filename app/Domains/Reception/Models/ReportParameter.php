<?php

namespace App\Domains\Reception\Models;

use App\Domains\Laboratory\Models\ReportTemplateParameter;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $report_id
 * @property int $parameter_id
 * @property array<array-key, mixed>|null $value
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
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
