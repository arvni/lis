<?php

namespace App\Domains\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $supplier_id
 * @property string $name
 * @property string|null $title
 * @property string|null $phone
 * @property string|null $mobile
 * @property string|null $email
 * @property bool $is_primary
 * @property string|null $notes
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class SupplierContact extends Model
{
    protected $fillable = [
        'supplier_id', 'name', 'title', 'phone', 'mobile',
        'email', 'is_primary', 'notes',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
    ];

    /** @return BelongsTo<Supplier, $this> */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }
}
