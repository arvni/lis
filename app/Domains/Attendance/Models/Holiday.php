<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Models;

use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * A company-wide day off: nobody is expected to work on this date, whatever their shift says.
 *
 * @property int $id
 * @property Carbon $date
 * @property string $title
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class Holiday extends Model
{
    use Searchable;

    protected $fillable = [
        'date',
        'title',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
    ];

    /** @var list<string> */
    protected $searchable = [
        'title',
    ];
}
