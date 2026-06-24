<?php

namespace App\Domains\Inventory\Models;

use App\Domains\Inventory\Enums\ApprovalStatus;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $purchase_request_id
 * @property int $workflow_step_id
 * @property \App\Domains\Inventory\Enums\ApprovalStatus $status
 * @property int|null $acted_by_user_id
 * @property int|null $delegated_to_user_id
 * @property string|null $notes
 * @property \Illuminate\Support\Carbon|null $acted_at
 * @property \Illuminate\Support\Carbon|null $due_at
 * @property bool $escalated
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
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

    /** @return BelongsTo<PurchaseRequest, $this> */
    public function purchaseRequest(): BelongsTo
    {
        return $this->belongsTo(PurchaseRequest::class);
    }

    /** @return BelongsTo<WorkflowStep, $this> */
    public function step(): BelongsTo
    {
        return $this->belongsTo(WorkflowStep::class, 'workflow_step_id');
    }

    /** @return BelongsTo<User, $this> */
    public function actedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'acted_by_user_id');
    }

    /** @return BelongsTo<User, $this> */
    public function delegatedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'delegated_to_user_id');
    }
}
