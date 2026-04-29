<?php

namespace App\Domains\Inventory\Models;

use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkflowStep extends Model
{
    protected $fillable = [
        'workflow_template_id', 'name', 'sort_order', 'deadline_days',
        'approver_user_id', 'approver_role',
    ];

    protected $casts = [
        'sort_order'    => 'integer',
        'deadline_days' => 'integer',
    ];

    public function template(): BelongsTo
    {
        return $this->belongsTo(WorkflowTemplate::class, 'workflow_template_id');
    }

    public function approverUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_user_id');
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(PurchaseRequestApproval::class);
    }

    public function canBeActedBy(User $user): bool
    {
        if ($this->approver_user_id && $this->approver_user_id === $user->id) {
            return true;
        }
        if ($this->approver_role && $user->hasRole($this->approver_role)) {
            return true;
        }
        return false;
    }
}
