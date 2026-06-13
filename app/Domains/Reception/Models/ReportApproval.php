<?php

namespace App\Domains\Reception\Models;

use App\Domains\Laboratory\Models\ApprovalFlowStep;
use App\Domains\Reception\Enums\ReportApprovalAction;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportApproval extends Model
{
    protected $fillable = [
        "report_id",
        "approval_flow_step_id",
        "user_id",
        "action",
        "comment",
    ];

    protected $casts = [
        "action" => ReportApprovalAction::class,
    ];

    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class);
    }

    public function step(): BelongsTo
    {
        return $this->belongsTo(ApprovalFlowStep::class, "approval_flow_step_id");
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
