<?php

namespace App\Domains\Reception\Models;

use App\Domains\Laboratory\Models\ReportTemplateParameter;
use Illuminate\Database\Eloquent\Model;

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

    public function report()
    {
        return $this->belongsTo(Report::class);
    }

    public function parameter()
    {
        return $this->belongsTo(ReportTemplateParameter::class);
    }
}
