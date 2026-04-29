<?php

namespace App\Domains\Inventory\Models;

use App\Domains\Inventory\Enums\ApprovalStatus;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseRequestApproval extends Model
{
    protected $fillable = [
        'purchase_request_id', 'workflow_step_id',
        'status', 'acted_by_user_id', 'delegated_to_user_id', 'notes', 'acted_at',
    ];

    protected $casts = [
        'status'    => ApprovalStatus::class,
        'acted_at'  => 'datetime',
        'due_at'    => 'datetime',
        'escalated' => 'boolean',
    ];

    public function purchaseRequest(): BelongsTo
    {
        return $this->belongsTo(PurchaseRequest::class);
    }

    public function step(): BelongsTo
    {
        return $this->belongsTo(WorkflowStep::class, 'workflow_step_id');
    }

    public function actedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'acted_by_user_id');
    }

    public function delegatedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'delegated_to_user_id');
    }
}
