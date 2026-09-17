<?php

declare(strict_types=1);

namespace App\Domains\Payroll\Models;

use App\Domains\Payroll\Enums\PayrollCalculation;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * An allowance or deduction that applies to one person month after month.
 *
 * It belongs to the person, not to a contract: a loan is owed whether or not the contract it began
 * under has since been replaced. What it is called, and whether it adds or takes away, comes from
 * the catalogue type; how much it is worth in a given month comes from its calculation.
 *
 * @property int $id
 * @property int $user_id
 * @property int $payroll_item_type_id
 * @property PayrollCalculation $calculation
 * @property numeric|null $amount
 * @property numeric|null $percentage
 * @property numeric|null $total_amount
 * @property int|null $installments
 * @property Carbon $start_date
 * @property Carbon|null $end_date
 * @property string|null $notes
 * @property int $sort_order
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class PayrollItem extends Model
{
    protected $fillable = [
        'user_id',
        'payroll_item_type_id',
        'calculation',
        'amount',
        'percentage',
        'total_amount',
        'installments',
        'start_date',
        'end_date',
        'notes',
        'sort_order',
    ];

    protected $casts = [
        'calculation' => PayrollCalculation::class,
        'amount' => 'decimal:3',
        'percentage' => 'decimal:3',
        'total_amount' => 'decimal:3',
        'installments' => 'integer',
        'start_date' => 'date:Y-m-d',
        'end_date' => 'date:Y-m-d',
        'sort_order' => 'integer',
    ];

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<PayrollItemType, $this> */
    public function type(): BelongsTo
    {
        return $this->belongsTo(PayrollItemType::class, 'payroll_item_type_id');
    }
}
