<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Models;

use App\Domains\Laboratory\Models\Test;
use App\Domains\PreOrder\Enums\ItemStatus;
use App\Domains\PreOrder\Enums\ReleasePurpose;
use App\Domains\PreOrder\Enums\Side;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * One test line. It doubles as the quotation line once finance arrives in phase 2.
 *
 * @property int $id
 * @property int $pre_order_id
 * @property int $test_id
 * @property string|null $patient_ref
 * @property int $qty
 * @property numeric|null $unit_price
 * @property Side $added_by
 * @property ItemStatus $status
 * @property int|null $request_id
 * @property string|null $release_key
 * @property ReleasePurpose|null $release_purpose
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class PreOrderItem extends Model
{
    protected $fillable = [
        'pre_order_id', 'test_id', 'patient_ref', 'qty', 'unit_price', 'added_by', 'status',
        'request_id', 'release_key', 'release_purpose',
    ];

    protected $casts = [
        'qty' => 'integer',
        'unit_price' => 'decimal:3',
        'added_by' => Side::class,
        'status' => ItemStatus::class,
        'release_purpose' => ReleasePurpose::class,
    ];

    /** @return BelongsTo<PreOrder, $this> */
    public function preOrder(): BelongsTo
    {
        return $this->belongsTo(PreOrder::class);
    }

    /** @return BelongsTo<Test, $this> */
    public function test(): BelongsTo
    {
        return $this->belongsTo(Test::class);
    }

    /** @return BelongsTo<PreOrderRequest, $this> */
    public function request(): BelongsTo
    {
        return $this->belongsTo(PreOrderRequest::class, 'request_id');
    }
}
