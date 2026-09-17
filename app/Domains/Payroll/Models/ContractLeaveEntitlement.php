<?php

declare(strict_types=1);

namespace App\Domains\Payroll\Models;

use App\Domains\Attendance\Models\LeaveKind;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * How much leave of one kind a contract grants. The figure is the whole allowance for the
 * contract's duration, not a yearly rate: it is never prorated, and a shorter contract simply
 * grants less.
 *
 * @property int $id
 * @property int $employment_contract_id
 * @property int $leave_kind_id
 * @property numeric $entitled_days
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class ContractLeaveEntitlement extends Model
{
    protected $fillable = [
        'employment_contract_id',
        'leave_kind_id',
        'entitled_days',
    ];

    protected $casts = [
        'entitled_days' => 'decimal:1',
    ];

    /** @return BelongsTo<EmploymentContract, $this> */
    public function contract(): BelongsTo
    {
        return $this->belongsTo(EmploymentContract::class, 'employment_contract_id');
    }

    /** @return BelongsTo<LeaveKind, $this> */
    public function kind(): BelongsTo
    {
        return $this->belongsTo(LeaveKind::class, 'leave_kind_id');
    }
}
