<?php

namespace App\Domains\Reception\Models;

use App\Domains\Laboratory\Models\ApprovalFlowStep;
use App\Domains\Reception\Enums\ReportApprovalAction;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $report_id
 * @property int|null $approval_flow_step_id
 * @property int $user_id
 * @property \App\Domains\Reception\Enums\ReportApprovalAction $action
 * @property string|null $comment
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
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

    /** @return BelongsTo<Report, $this> */
    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class);
    }

    /** @return BelongsTo<ApprovalFlowStep, $this> */
    public function step(): BelongsTo
    {
        return $this->belongsTo(ApprovalFlowStep::class, "approval_flow_step_id");
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
