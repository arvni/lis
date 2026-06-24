<?php

namespace App\Domains\Inventory\Models;

use App\Domains\Inventory\Enums\SupplierType;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Builder;

/**
 * @property int $id
 * @property string $name
 * @property string $code
 * @property \App\Domains\Inventory\Enums\SupplierType $type
 * @property string|null $country
 * @property string|null $city
 * @property string|null $address
 * @property string|null $website
 * @property string|null $payment_terms
 * @property int|null $lead_time_days
 * @property bool $is_active
 * @property string|null $notes
 * @property string|null $tax_number
 * @property string|null $commercial_registration
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 */
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

    /** @return HasMany<SupplierContact, $this> */
    public function contacts(): HasMany
    {
        return $this->hasMany(SupplierContact::class);
    }

    /** @return HasMany<SupplierItem, $this> */
    public function supplierItems(): HasMany
    {
        return $this->hasMany(SupplierItem::class);
    }

    /** @return HasMany<StockTransaction, $this> */
    public function transactions(): HasMany
    {
        return $this->hasMany(StockTransaction::class);
    }

    /**
     * @param  Builder<Supplier>  $query
     * @return Builder<Supplier>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
