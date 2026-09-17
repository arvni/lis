<?php

declare(strict_types=1);

namespace App\Domains\Payroll\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * One line of a salary slip. The amount is signed, so the net is simply the sum of the lines and
 * nothing has to know which way a given line goes.
 *
 * A line produced by one of the person's recurring items remembers which item it came from and,
 * for a loan, which instalment it was. That number is recorded here rather than counted each time
 * so that editing an issued slip can never renumber a loan behind everyone's back.
 *
 * @property int $id
 * @property int $salary_slip_id
 * @property string $code
 * @property string $label
 * @property numeric $amount
 * @property string|null $note
 * @property int|null $payroll_item_id
 * @property int|null $installment_number
 * @property int $sort_order
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class SalarySlipLine extends Model
{
    public const BASE = 'BASE';

    public const OVERTIME = 'OVERTIME';

    public const ABSENCE = 'ABSENCE';

    public const UNPAID_LEAVE = 'UNPAID_LEAVE';

    public const ITEM = 'ITEM';

    protected $fillable = [
        'salary_slip_id',
        'code',
        'label',
        'amount',
        'note',
        'payroll_item_id',
        'installment_number',
        'sort_order',
    ];

    protected $casts = [
        'amount' => 'decimal:3',
        'installment_number' => 'integer',
        'sort_order' => 'integer',
    ];

    /** @return BelongsTo<SalarySlip, $this> */
    public function slip(): BelongsTo
    {
        return $this->belongsTo(SalarySlip::class, 'salary_slip_id');
    }

    /** @return BelongsTo<PayrollItem, $this> */
    public function payrollItem(): BelongsTo
    {
        return $this->belongsTo(PayrollItem::class, 'payroll_item_id');
    }
}
