<?php

namespace App\Domains\Inventory\Models;

use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Store extends Model
{
    protected $fillable = [
        'name', 'code', 'description', 'is_active',
        'manager_user_id', 'address', 'notes',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /** @return BelongsTo<User, $this> */
    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_user_id');
    }

    /** @return HasMany<StoreLocation, $this> */
    public function locations(): HasMany
    {
        return $this->hasMany(StoreLocation::class);
    }

    /** @return HasMany<StockLot, $this> */
    public function lots(): HasMany
    {
        return $this->hasMany(StockLot::class);
    }

    /** @return HasMany<StockTransaction, $this> */
    public function transactions(): HasMany
    {
        return $this->hasMany(StockTransaction::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
