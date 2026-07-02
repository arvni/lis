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
use Illuminate\Database\Eloquent\Builder;

/**
 * @property int $id
 * @property string $item_code
 * @property string $name
 * @property string|null $scientific_name
 * @property \App\Domains\Inventory\Enums\ItemDepartment $department
 * @property \App\Domains\Inventory\Enums\ItemMaterialType $material_type
 * @property string|null $description
 * @property \App\Domains\Inventory\Enums\StorageCondition $storage_condition
 * @property string|null $storage_condition_notes
 * @property int $default_unit_id
 * @property bool $is_active
 * @property bool $is_hazardous
 * @property bool $requires_lot_tracking
 * @property numeric $minimum_stock_level
 * @property numeric|null $maximum_stock_level
 * @property int|null $lead_time_days
 * @property string|null $image
 * @property string|null $msds_file
 * @property string|null $notes
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 */
class Item extends Model
{
    use SoftDeletes, Searchable;

    /** @var list<string> */
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

    /** @return BelongsTo<Unit, $this> */
    public function defaultUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'default_unit_id');
    }

    /** @return HasMany<ItemUnitConversion, $this> */
    public function unitConversions(): HasMany
    {
        return $this->hasMany(ItemUnitConversion::class);
    }

    /** @return HasMany<SupplierItem, $this> */
    public function supplierItems(): HasMany
    {
        return $this->hasMany(SupplierItem::class);
    }

    /** @return HasMany<ItemBarcode, $this> */
    public function barcodes(): HasMany
    {
        return $this->hasMany(ItemBarcode::class);
    }

    /** @return HasMany<StockLot, $this> */
    public function lots(): HasMany
    {
        return $this->hasMany(StockLot::class);
    }

    /** @return HasMany<StockTransactionLine, $this> */
    public function transactionLines(): HasMany
    {
        return $this->hasMany(StockTransactionLine::class);
    }

    /** @return HasMany<ReorderAlert, $this> */
    public function reorderAlerts(): HasMany
    {
        return $this->hasMany(ReorderAlert::class);
    }

    /**
     * @param  Builder<Item>  $query
     * @return Builder<Item>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * @param  Builder<Item>  $query
     * @return Builder<Item>
     */
    public function scopeLowStock(Builder $query): Builder
    {
        return $query->whereRaw('minimum_stock_level > 0')
            ->whereHas('lots', function ($q) {
                $q->where('status', 'ACTIVE')
                  ->havingRaw('SUM(quantity_base_units) < items.minimum_stock_level');
            });
    }
}
