<?php

namespace App\Domains\Inventory\Models;

use App\Domains\Inventory\Enums\TransactionStatus;
use App\Domains\Inventory\Enums\TransactionType;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

/**
 * @property int $id
 * @property \App\Domains\Inventory\Enums\TransactionType $transaction_type
 * @property string $reference_number
 * @property \Illuminate\Support\Carbon $transaction_date
 * @property int $store_id
 * @property int|null $destination_store_id
 * @property int|null $supplier_id
 * @property int $requested_by_user_id
 * @property int|null $approved_by_user_id
 * @property \App\Domains\Inventory\Enums\TransactionStatus $status
 * @property string|null $notes
 * @property string|null $attachment
 * @property numeric $total_value
 * @property \Illuminate\Support\Carbon|null $transfer_received_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property int|null $transfer_received_by_user_id
 */
class StockTransaction extends Model
{
    protected $fillable = [
        'transaction_type', 'reference_number', 'transaction_date',
        'store_id', 'destination_store_id', 'supplier_id',
        'requested_by_user_id', 'approved_by_user_id',
        'status', 'notes', 'attachment', 'total_value',
        'transfer_received_at', 'transfer_received_by_user_id',
    ];

    protected $casts = [
        'transaction_type'      => TransactionType::class,
        'status'                => TransactionStatus::class,
        'transaction_date'      => 'date:Y-m-d',
        'total_value'           => 'decimal:4',
        'transfer_received_at'  => 'datetime',
    ];

    /** @return BelongsTo<Store, $this> */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    /** @return BelongsTo<Store, $this> */
    public function destinationStore(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'destination_store_id');
    }

    /** @return BelongsTo<Supplier, $this> */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

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

    /** @return HasMany<StockTransactionLine, $this> */
    public function lines(): HasMany
    {
        return $this->hasMany(StockTransactionLine::class, 'transaction_id');
    }

    /** @return HasMany<TransactionHistory, $this> */
    public function histories(): HasMany
    {
        return $this->hasMany(TransactionHistory::class, 'transaction_id')->orderBy('created_at');
    }

    /**
     * @param  Builder<StockTransaction>  $query
     * @return Builder<StockTransaction>
     */
    public function scopeApproved(Builder $query): Builder
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
