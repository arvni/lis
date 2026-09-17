<?php

declare(strict_types=1);

namespace App\Domains\Payroll\Models;

use App\Domains\Payroll\Enums\EmploymentType;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * What someone is employed on: their pay, the period it covers and the terms a salary slip is
 * built from. A person's contracts never overlap, and the one without an end date is still
 * running. Ending a contract early means setting its end date, not deleting it.
 *
 * Allowances and deductions are NOT here: they belong to the person (see PayrollItem), because a
 * loan is still owed when the contract it began under is replaced.
 *
 * @property int $id
 * @property int $user_id
 * @property string|null $position
 * @property EmploymentType $employment_type
 * @property numeric $base_salary
 * @property numeric $overtime_multiplier
 * @property Carbon $start_date
 * @property Carbon|null $end_date
 * @property Carbon|null $probation_end_date
 * @property string|null $reference
 * @property string|null $notes
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class EmploymentContract extends Model
{
    protected $fillable = [
        'user_id',
        'position',
        'employment_type',
        'base_salary',
        'overtime_multiplier',
        'start_date',
        'end_date',
        'probation_end_date',
        'reference',
        'notes',
    ];

    protected $casts = [
        'employment_type' => EmploymentType::class,
        'base_salary' => 'decimal:3',
        'overtime_multiplier' => 'decimal:2',
        'start_date' => 'date:Y-m-d',
        'end_date' => 'date:Y-m-d',
        'probation_end_date' => 'date:Y-m-d',
    ];

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<ContractLeaveEntitlement, $this> */
    public function entitlements(): HasMany
    {
        return $this->hasMany(ContractLeaveEntitlement::class);
    }

    /**
     * Whether the contract covers a date. An open-ended contract covers everything from its start.
     */
    public function coversDate(Carbon $date): bool
    {
        return $this->start_date->lte($date)
            && ($this->end_date === null || $this->end_date->gte($date));
    }
}
