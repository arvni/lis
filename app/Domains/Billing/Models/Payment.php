<?php

namespace App\Domains\Billing\Models;

use App\Domains\Billing\Enums\PaymentMethod;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        "invoice_id",
        "cashier_id",
        "payer_type",
        "payer_id",
        "price",
        "paymentMethod",
        "information",
    ];

    protected $casts=[
        "information" => "json",
        "price" => "float",
        "paymentMethod" => PaymentMethod::class
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function cashier()
    {
        return $this->belongsTo(User::class, "cashier_id");
    }

    public function payer()
    {
        return $this->morphTo("payer");
    }

}
