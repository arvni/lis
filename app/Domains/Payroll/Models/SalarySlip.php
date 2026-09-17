<?php

declare(strict_types=1);

namespace App\Domains\Payroll\Models;

use App\Domains\Payroll\Enums\EmploymentType;
use App\Domains\Payroll\Enums\SalarySlipStatus;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * One person's pay for one month, as prepared and then given to them.
 *
 * The terms it was worked out from are copied onto it — basic salary, position, the working day,
 * the attendance figures and the leave balance — so an issued slip goes on saying what it said
 * even after a contract is changed or an attendance day is corrected.
 *
 * @property int $id
 * @property int $user_id
 * @property int|null $employment_contract_id
 * @property Carbon $period_from
 * @property Carbon $period_to
 * @property SalarySlipStatus $status
 * @property string|null $number
 * @property numeric $net
 * @property numeric $basic_salary
 * @property string|null $position
 * @property string|null $employment_type
 * @property int $scheduled_minutes
 * @property int|null $working_day_minutes
 * @property array<string, mixed>|null $attendance
 * @property array<string, mixed>|null $leave_balance
 * @property string|null $notes
 * @property int|null $created_by
 * @property Carbon|null $issued_at
 * @property int|null $issued_by
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class SalarySlip extends Model
{
    protected $fillable = [
        'user_id',
        'employment_contract_id',
        'period_from',
        'period_to',
        'status',
        'number',
        'net',
        'basic_salary',
        'position',
        'employment_type',
        'scheduled_minutes',
        'working_day_minutes',
        'attendance',
        'leave_balance',
        'notes',
        'created_by',
        'issued_at',
        'issued_by',
    ];

    protected $casts = [
        'period_from' => 'date:Y-m-d',
        'period_to' => 'date:Y-m-d',
        'status' => SalarySlipStatus::class,
        'net' => 'decimal:3',
        'basic_salary' => 'decimal:3',
        'scheduled_minutes' => 'integer',
        'working_day_minutes' => 'integer',
        'attendance' => 'array',
        'leave_balance' => 'array',
        'issued_at' => 'datetime',
    ];

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<EmploymentContract, $this> */
    public function contract(): BelongsTo
    {
        return $this->belongsTo(EmploymentContract::class, 'employment_contract_id');
    }

    /** @return BelongsTo<User, $this> */
    public function issuedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issued_by');
    }

    /** @return HasMany<SalarySlipLine, $this> */
    public function lines(): HasMany
    {
        return $this->hasMany(SalarySlipLine::class)->orderBy('sort_order')->orderBy('id');
    }

    /**
     * The employment type as a person would say it. Stored as the enum's raw value, so it has to
     * be read back through the enum rather than printed as it sits.
     */
    public function employmentTypeLabel(): ?string
    {
        return $this->employment_type === null
            ? null
            : EmploymentType::tryFrom($this->employment_type)?->label();
    }

    public function isDraft(): bool
    {
        return $this->status === SalarySlipStatus::DRAFT;
    }

    public function isIssued(): bool
    {
        return $this->status === SalarySlipStatus::ISSUED;
    }
}
