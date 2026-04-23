<?php

namespace App\Domains\Inventory\Models;

use App\Domains\Inventory\Enums\TransactionStatus;
use App\Domains\Inventory\Enums\TransactionType;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockTransaction extends Model
{
    protected $fillable = [
        'transaction_type', 'reference_number', 'transaction_date',
        'store_id', 'destination_store_id', 'supplier_id',
        'requested_by_user_id', 'approved_by_user_id',
        'status', 'notes', 'attachment', 'total_value',
    ];

    protected $casts = [
        'transaction_type' => TransactionType::class,
        'status'           => TransactionStatus::class,
        'transaction_date' => 'date:Y-m-d',
        'total_value'      => 'decimal:4',
    ];

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function destinationStore(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'destination_store_id');
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by_user_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(StockTransactionLine::class, 'transaction_id');
    }

    public function histories(): HasMany
    {
        return $this->hasMany(TransactionHistory::class, 'transaction_id')->orderBy('created_at');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', TransactionStatus::APPROVED->value);
    }

    public function isDraft(): bool
    {
        return $this->status === TransactionStatus::DRAFT;
    }

    public function isPendingApproval(): bool
    {
        return $this->status === TransactionStatus::PENDING_APPROVAL;
    }

    public function isApproved(): bool
    {
        return $this->status === TransactionStatus::APPROVED;
    }
}
