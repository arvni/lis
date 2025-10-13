<?php

namespace App\Models;

use App\Domains\Billing\Models\Invoice;
use App\Domains\Reception\Models\AcceptanceItem;
use Illuminate\Database\Eloquent\Model;

class InvoiceItem extends Model
{
    protected $fillable = [
        'invoice_id',
        'title',
        'description',
        'code',
        'price',
        'unit_price',
        'qty',
        'discount',
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function acceptanceItems()
    {
        return $this->hasMany(AcceptanceItem::class);
    }


}
