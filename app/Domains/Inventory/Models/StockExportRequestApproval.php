<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Models;

use App\Domains\Inventory\Enums\ApprovalStatus;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $stock_export_request_id
 * @property int $workflow_step_id
 * @property ApprovalStatus $status
 * @property int|null $acted_by_user_id
 * @property int|null $delegated_to_user_id
 * @property string|null $notes
 * @property Carbon|null $acted_at
 * @property Carbon|null $due_at
 * @property bool $escalated
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class StockExportRequestApproval extends Model
{
    protected $fillable = [
        'stock_export_request_id', 'workflow_step_id',
        'status', 'acted_by_user_id', 'delegated_to_user_id', 'notes', 'acted_at', 'due_at',
    ];

    protected $casts = [
        'status' => ApprovalStatus::class,
        'acted_at' => 'datetime',
        'due_at' => 'datetime',
        'escalated' => 'boolean',
    ];

    /** @return BelongsTo<StockExportRequest, $this> */
    public function stockExportRequest(): BelongsTo
    {
        return $this->belongsTo(StockExportRequest::class);
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
