<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Models;

use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * A weekly working pattern that repeats every week: each ShiftDay holds one weekday's hours,
 * and a weekday without one is a day off.
 *
 * @property int $id
 * @property string $name
 * @property string|null $description
 * @property bool $is_active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class Shift extends Model
{
    use Searchable;

    protected $fillable = [
        'name',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /** @var list<string> */
    protected $searchable = [
        'name',
    ];

    /** @return HasMany<ShiftDay, $this> */
    public function days(): HasMany
    {
        return $this->hasMany(ShiftDay::class)->orderBy('weekday');
    }

    /** @return HasMany<UserShift, $this> */
    public function assignments(): HasMany
    {
        return $this->hasMany(UserShift::class);
    }
}
