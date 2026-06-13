<?php

namespace App\Domains\Reception\Models;

use App\Domains\Document\Enums\DocumentTag;
use App\Domains\Document\Models\Document;
use App\Domains\Laboratory\Models\ApprovalFlow;
use App\Domains\Laboratory\Models\ApprovalFlowStep;
use App\Domains\Laboratory\Models\ReportTemplate;
use App\Domains\Reception\Enums\ReportApprovalAction;
use App\Domains\Reception\Enums\ReportApprovalStatus;
use App\Domains\User\Models\User;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class Report extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        "value",
        "reporter_id",
        "approver_id",
        "publisher_id",
        "acceptance_item_id",
        "report_template_id",
        "status",
        "approval_status",
        "current_step_position",
        "comment",
        "clinical_comment",
        "published_at",
        "reported_at",
        "approved_at",
        "printed_at",
    ];

    protected $touches = [
        "acceptanceItem"
    ];

    protected $casts = [
        "status" => "boolean",
        "approval_status" => ReportApprovalStatus::class,
        "current_step_position" => "integer",
        "approved_at" => "datetime",
        "reported_at" => "datetime",
        "printed_at" => "datetime",
    ];

    protected $with = [
        "publishedDocument",
        "approvedDocument",
        "reportedDocument",
        "clinicalCommentDocument",
        "additionalFiles"
    ];

    public function acceptanceItem(): BelongsTo
    {
        return $this->belongsTo(AcceptanceItem::class);
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, "reporter_id", "id");
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, "approver_id");
    }

    public function publisher(): BelongsTo
    {
        return $this->belongsTo(User::class, "publisher_id");
    }

    public function documents(): MorphMany
    {
        return $this->morphMany(Document::class, 'related');
    }

    public function additionalFiles(): MorphMany
    {
        return $this->morphMany(Document::class, 'related')
            ->latest()
            ->where("tag", DocumentTag::ADDITIONAL);
    }

    public function publishedDocument(): MorphOne
    {
        return $this->morphOne(Document::class, 'related')
            ->latest()
            ->where("tag", DocumentTag::PUBLISHED);
    }

    public function approvedDocument(): MorphOne
    {
        return $this->morphOne(Document::class, 'related')
            ->latest()
            ->where("tag", DocumentTag::APPROVED);
    }

    public function reportedDocument(): MorphOne
    {
        return $this->morphOne(Document::class, 'related')
            ->latest()
            ->where("tag", DocumentTag::REPORTED);
    }

    public function clinicalCommentDocument(): MorphOne
    {
        return $this->morphOne(Document::class, 'related')
            ->latest()
            ->where("tag", DocumentTag::CLINICAL_COMMENT);
    }

    public function signers(): HasMany
    {
        return $this->hasMany(Signer::class)
            ->with(["user:id,name,signature,title,stamp"]);
    }

    public function scopePublished($query)
    {
        return $query->whereNotNull("published_at");
    }

    public function parameters(): HasMany
    {
        return $this->hasMany(ReportParameter::class);
    }

    public function reportTemplate(): BelongsTo
    {
        return $this->belongsTo(ReportTemplate::class);
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(ReportApproval::class)
            ->with(["user:id,name", "step:id,approval_flow_id,position,name"])
            ->oldest("id");
    }

    /**
     * The approval flow governing this report, taken from its template.
     * Null means the legacy single-approval behavior.
     */
    public function approvalFlow(): ?ApprovalFlow
    {
        $this->loadMissing("reportTemplate.approvalFlow.steps");
        return $this->reportTemplate?->approvalFlow;
    }

    /**
     * The step awaiting action, or null when no flow is assigned
     * or the flow has run to completion.
     */
    public function currentApprovalStep(): ?ApprovalFlowStep
    {
        $flow = $this->approvalFlow();
        if (!$flow || !$flow->active) {
            return null;
        }

        if ($this->current_step_position === null) {
            return $flow->firstStep();
        }

        return $flow->steps->firstWhere("position", $this->current_step_position);
    }

    /**
     * Whether approving now completes the flow (no flow = single legacy step).
     */
    public function isOnFinalApprovalStep(): bool
    {
        $step = $this->currentApprovalStep();
        if (!$step) {
            return true;
        }

        return $this->approvalFlow()->stepAfter($step->position) === null;
    }

    /**
     * Reports whose pending approval the given user may act on:
     * either the template has no active flow (legacy single approval),
     * or the report's current step matches the user's id/roles (or is
     * unbound) and the user hasn't already approved a step this cycle.
     */
    public function scopeApprovableBy($query, User $user)
    {
        $roleIds = $user->roles()->pluck("id");

        return $query->where(function ($query) use ($user, $roleIds) {
            $query->whereDoesntHave("reportTemplate.approvalFlow", function ($q) {
                $q->where("active", true);
            })
                ->orWhere(function ($query) use ($user, $roleIds) {
                    $query
                        ->whereHas("reportTemplate.approvalFlow", function ($q) use ($user, $roleIds) {
                            $q->where("active", true)
                                ->whereHas("steps", function ($q) use ($user, $roleIds) {
                                    $q->whereRaw("approval_flow_steps.position = COALESCE(reports.current_step_position, (SELECT MIN(s.position) FROM approval_flow_steps s WHERE s.approval_flow_id = approval_flow_steps.approval_flow_id))")
                                        ->where(function ($q) use ($user, $roleIds) {
                                            $q->where("approval_flow_steps.user_id", $user->id)
                                                ->orWhereIn("approval_flow_steps.role_id", $roleIds)
                                                ->orWhere(function ($q) {
                                                    $q->whereNull("approval_flow_steps.user_id")
                                                        ->whereNull("approval_flow_steps.role_id");
                                                });
                                        })
                                        ->where(function ($q) use ($user) {
                                            $q->where("approval_flow_steps.allow_self_approval", true)
                                                ->orWhereRaw("reports.reporter_id != ?", [$user->id]);
                                        });
                                });
                        })
                        ->whereDoesntHave("approvals", function ($q) use ($user) {
                            $q->where("user_id", $user->id)
                                ->where("action", ReportApprovalAction::APPROVED);
                        });
                });
        });
    }

    public function scopeNotApproved($query)
    {
        return $query->whereNull("approved_at")->whereNull("approver_id");
    }

    public function scopeIsActive($query)
    {
        return $query->where("status", true);
    }

    public function scopeSearch($query, $search)
    {
        return $query->whereHas("acceptanceItem", function ($query) use ($search) {
            $query
                ->whereHas("samples", function ($query) use ($search) {
                    $query->search($search);
                })
                ->orWhereHas("patient", function ($query) use ($search) {
                    $query->search($search);
                })
                ->orWhereHas("test", function ($query) use ($search) {
                    $query->search($search);
                });
        });
    }
}
