<?php

namespace App\Domains\Billing\Models;

use App\Domains\Billing\Enums\PaymentMethod;
use App\Domains\User\Models\User;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Payment extends Model
{
    use Searchable;
    protected $fillable = [
        "invoice_id",
        "cashier_id",
        "payer_type",
        "payer_id",
        "price",
        "paymentMethod",
        "information",
    ];
    protected $searchable=[
        "payer.fullName",
    ];

    protected $casts=[
        "information" => "json",
        "price" => "float",
        "paymentMethod" => PaymentMethod::class,
    ];

    /** @return BelongsTo<Invoice, $this> */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    /** @return BelongsTo<User, $this> */
    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, "cashier_id");
    }

    public function payer(): MorphTo
    {
        return $this->morphTo("payer");
    }

}
