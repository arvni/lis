<?php

namespace App\Domains\Inventory\Models;

use App\Domains\Inventory\Enums\SupplierType;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
    use SoftDeletes, Searchable;

    protected $searchable = ['name', 'code', 'tax_number'];

    protected $fillable = [
        'name', 'code', 'type', 'country', 'city', 'address',
        'website', 'payment_terms', 'lead_time_days', 'is_active',
        'notes', 'tax_number', 'commercial_registration',
    ];

    protected $casts = [
        'type'      => SupplierType::class,
        'is_active' => 'boolean',
    ];

    public function contacts(): HasMany
    {
        return $this->hasMany(SupplierContact::class);
    }

    public function supplierItems(): HasMany
    {
        return $this->hasMany(SupplierItem::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(StockTransaction::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
