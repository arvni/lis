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
        'urgency', 'notes', 'status',
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

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by_user_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function lines(): HasMany
    {
        return $this->hasMany(PurchaseRequestLine::class);
    }

    public function histories(): HasMany
    {
        return $this->hasMany(PurchaseRequestHistory::class)->orderBy('created_at');
    }

    public function receipts(): HasMany
    {
        return $this->hasMany(PurchaseRequestReceipt::class)->orderBy('created_at');
    }
}
