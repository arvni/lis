<?php

declare(strict_types=1);

namespace App\Domains\Payroll\Models;

use App\Domains\Payroll\Enums\AllowanceKind;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * A pay item that recurs month after month, e.g. Housing allowance or an insurance deduction.
 * Defined once and then picked on each contract that has one, so the same item is named the same
 * way everywhere. The default amount is only a starting point — a contract owns its own amount.
 *
 * @property int $id
 * @property string $name
 * @property AllowanceKind $kind
 * @property numeric|null $default_amount
 * @property bool $is_active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class PayrollItemType extends Model
{
    use Searchable;

    protected $fillable = [
        'name',
        'kind',
        'default_amount',
        'is_active',
    ];

    protected $casts = [
        'kind' => AllowanceKind::class,
        'default_amount' => 'decimal:3',
        'is_active' => 'boolean',
    ];

    /** @var list<string> */
    protected $searchable = [
        'name',
    ];
}
