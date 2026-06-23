<?php

namespace App\Domains\Inventory\Models;

use App\Domains\Inventory\Enums\PurchaseRequestStatus;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseRequest extends Model
{
    protected $fillable = [
        'requested_by_user_id', 'approved_by_user_id', 'supplier_id',
        'urgency', 'notes', 'status', 'workflow_template_id',
        'po_number', 'po_file',
        'payment_date', 'payment_reference', 'payment_file',
        'shipment_date', 'tracking_number', 'expected_delivery_date', 'currency',
    ];

    protected $casts = [
        'status'                => PurchaseRequestStatus::class,
        'payment_date'          => 'date:Y-m-d',
        'shipment_date'         => 'date:Y-m-d',
        'expected_delivery_date'=> 'date:Y-m-d',
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

    /** @return BelongsTo<Supplier, $this> */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /** @return BelongsTo<WorkflowTemplate, $this> */
    public function workflowTemplate(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(WorkflowTemplate::class);
    }

    /** @return HasMany<PurchaseRequestApproval, $this> */
    public function approvals(): HasMany
    {
        return $this->hasMany(PurchaseRequestApproval::class);
    }

    public function estimatedTotal(): float
    {
        return $this->lines->sum(fn($l) => (float) $l->qty * (float) ($l->estimated_unit_price ?? 0));
    }

    /** @return HasMany<PurchaseRequestLine, $this> */
    public function lines(): HasMany
    {
        return $this->hasMany(PurchaseRequestLine::class);
    }

    /** @return HasMany<PurchaseRequestComment, $this> */
    public function comments(): HasMany
    {
        return $this->hasMany(PurchaseRequestComment::class)->orderBy('created_at');
    }

    /** @return HasMany<PurchaseRequestHistory, $this> */
    public function histories(): HasMany
    {
        return $this->hasMany(PurchaseRequestHistory::class)->orderBy('created_at');
    }

    /** @return HasMany<PurchaseRequestReceipt, $this> */
    public function receipts(): HasMany
    {
        return $this->hasMany(PurchaseRequestReceipt::class)->orderBy('created_at');
    }
}
