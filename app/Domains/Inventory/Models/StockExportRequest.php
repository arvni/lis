<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Models;

use App\Domains\Inventory\Enums\StockExportRequestStatus;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $requested_by_user_id
 * @property int|null $approved_by_user_id
 * @property int $store_id
 * @property string $destination
 * @property string|null $purpose
 * @property string $urgency
 * @property string|null $notes
 * @property StockExportRequestStatus $status
 * @property int|null $workflow_template_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class StockExportRequest extends Model
{
    protected $fillable = [
        'requested_by_user_id', 'approved_by_user_id', 'store_id',
        'destination', 'purpose', 'urgency', 'notes', 'status', 'workflow_template_id',
    ];

    protected $casts = [
        'status' => StockExportRequestStatus::class,
    ];

    /** @return BelongsTo<User, $this> */
    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by_user_id');
    }

    /** @return BelongsTo<User, $this> */
    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }

    /** @return BelongsTo<Store, $this> */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    /** @return BelongsTo<WorkflowTemplate, $this> */
    public function workflowTemplate(): BelongsTo
    {
        return $this->belongsTo(WorkflowTemplate::class);
    }

    /** @return HasMany<StockExportRequestApproval, $this> */
    public function approvals(): HasMany
    {
        return $this->hasMany(StockExportRequestApproval::class);
    }

    /** @return HasMany<StockExportRequestLine, $this> */
    public function lines(): HasMany
    {
        return $this->hasMany(StockExportRequestLine::class);
    }

    /** @return HasMany<StockExportRequestComment, $this> */
    public function comments(): HasMany
    {
        return $this->hasMany(StockExportRequestComment::class)->orderBy('created_at');
    }

    /** @return HasMany<StockExportRequestHistory, $this> */
    public function histories(): HasMany
    {
        return $this->hasMany(StockExportRequestHistory::class)->orderBy('created_at');
    }

    /** @return HasMany<StockExportRequestFulfillment, $this> */
    public function fulfillments(): HasMany
    {
        return $this->hasMany(StockExportRequestFulfillment::class)->orderBy('created_at');
    }

    /**
     * Export requests carry no monetary value; the workflow matcher's min_total
     * condition therefore never gates them (always treated as 0).
     */
    public function estimatedValue(): float
    {
        return 0.0;
    }
}
