<?php

namespace App\Domains\Inventory\Models;

use App\Domains\Inventory\Enums\ItemDepartment;
use App\Domains\Inventory\Enums\ItemMaterialType;
use App\Domains\Inventory\Enums\StorageCondition;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Item extends Model
{
    use SoftDeletes, Searchable;

    protected $searchable = ['item_code', 'name', 'scientific_name'];

    protected $fillable = [
        'item_code', 'name', 'scientific_name', 'department', 'material_type',
        'description', 'storage_condition', 'storage_condition_notes',
        'default_unit_id', 'is_active', 'is_hazardous', 'requires_lot_tracking',
        'minimum_stock_level', 'maximum_stock_level', 'lead_time_days',
        'image', 'msds_file', 'notes',
    ];

    protected $casts = [
        'department'          => ItemDepartment::class,
        'material_type'       => ItemMaterialType::class,
        'storage_condition'   => StorageCondition::class,
        'is_active'           => 'boolean',
        'is_hazardous'        => 'boolean',
        'requires_lot_tracking' => 'boolean',
        'minimum_stock_level' => 'decimal:6',
        'maximum_stock_level' => 'decimal:6',
    ];

    public function defaultUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'default_unit_id');
    }

    public function unitConversions(): HasMany
    {
        return $this->hasMany(ItemUnitConversion::class);
    }

    public function supplierItems(): HasMany
    {
        return $this->hasMany(SupplierItem::class);
    }

    public function lots(): HasMany
    {
        return $this->hasMany(StockLot::class);
    }

    public function transactionLines(): HasMany
    {
        return $this->hasMany(StockTransactionLine::class);
    }

    public function reorderAlerts(): HasMany
    {
        return $this->hasMany(ReorderAlert::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeLowStock($query)
    {
        return $query->whereRaw('minimum_stock_level > 0')
            ->whereHas('lots', function ($q) {
                $q->where('status', 'ACTIVE')
                  ->havingRaw('SUM(quantity_base_units) < items.minimum_stock_level');
            });
    }
}
