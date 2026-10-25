<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Models;

use App\Domains\Laboratory\Models\Test;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string $family
 * @property bool $active
 * @property list<array<string, mixed>> $stages
 * @property int $version
 * @property int|null $tests_count
 * @property int|null $open_pre_orders_count
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class Flow extends Model
{
    protected $fillable = ['name', 'family', 'active', 'stages', 'version'];

    protected $casts = [
        'active' => 'boolean',
        'stages' => 'array',
        'version' => 'integer',
    ];

    /** @return HasMany<Test, $this> */
    public function tests(): HasMany
    {
        return $this->hasMany(Test::class);
    }

    /** @return HasMany<PreOrder, $this> */
    public function preOrders(): HasMany
    {
        return $this->hasMany(PreOrder::class);
    }
}
