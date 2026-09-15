<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Models;

use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * A kind of leave people can ask for, e.g. Annual, Sick, Unpaid.
 *
 * @property int $id
 * @property string $name
 * @property bool $is_active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class LeaveKind extends Model
{
    use Searchable;

    protected $fillable = [
        'name',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /** @var list<string> */
    protected $searchable = [
        'name',
    ];
}
