<?php

namespace App\Domains\Laboratory\Models;

use App\Domains\Reception\Models\ReportApproval;
use App\Domains\User\Models\Role;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ApprovalFlowStep extends Model
{
    protected $fillable = [
        "approval_flow_id",
        "position",
        "name",
        "role_id",
        "user_id",
        "allow_self_approval",
    ];

    protected $casts = [
        "position" => "integer",
        "allow_self_approval" => "boolean",
    ];

    public function approvalFlow(): BelongsTo
    {
        return $this->belongsTo(ApprovalFlow::class);
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(ReportApproval::class);
    }

    /**
     * Whether the given user is eligible to act on this step.
     * A step bound to a user matches only that user; a step bound to a role
     * matches users holding it; an unbound step matches anyone holding the
     * base approve permission.
     */
    public function isActionableBy(User $user): bool
    {
        if ($this->user_id) {
            return $this->user_id === $user->id;
        }

        if ($this->role_id) {
            $this->loadMissing("role");
            return $user->hasRole($this->role->name);
        }

        return $user->can("Report.Approve Report");
    }

    /**
     * All users matching this step's binding: the bound user, holders of the
     * bound role, or - for unbound steps - everyone with the base approve
     * permission. Per-report rules (self-approval, one step per user) are
     * the policy's job, not this method's.
     */
    public function eligibleUsers(): Collection
    {
        // Permissions/roles are eager loaded so the policy checks that follow
        // don't trip the lazy-loading guard.
        $query = User::query()->with("permissions", "roles.permissions");

        if ($this->user_id) {
            return $query->whereKey($this->user_id)->get();
        }

        if ($this->role_id) {
            $this->loadMissing("role");
            return $query->role($this->role->name)->get();
        }

        return $query->permission("Report.Approve Report")->get();
    }
}
