<?php

namespace App\Domains\Billing\Models;

use App\Domains\Billing\Enums\InvoiceItemKind;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class InvoiceItem extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'invoice_id',
        'acceptance_id',
        'kind',
        'test_id',
        'panel_id',
        'title',
        'code',
        'description',
        'unit_price',
        'qty',
        'price',
        'discount',
        'customParameters',
        'locked_at',
    ];

    protected $casts = [
        'kind' => InvoiceItemKind::class,
        'unit_price' => 'decimal:3',
        'price' => 'decimal:3',
        'discount' => 'decimal:3',
        'qty' => 'integer',
        'customParameters' => 'json',
        'locked_at' => 'datetime',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function acceptance(): BelongsTo
    {
        return $this->belongsTo(Acceptance::class);
    }

    public function acceptanceItems(): HasMany
    {
        return $this->hasMany(AcceptanceItem::class);
    }

    public function test(): BelongsTo
    {
        return $this->belongsTo(Test::class);
    }

    public function panelTest(): BelongsTo
    {
        return $this->belongsTo(Test::class, 'panel_id');
    }

    public function isLocked(): bool
    {
        return $this->locked_at !== null;
    }
}
