<?php

namespace App\Domains\Reception\Models;

use App\Domains\Laboratory\Models\MethodTest;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $acceptance_item_id
 * @property int $from_method_test_id
 * @property int $to_method_test_id
 * @property string $conversion_type
 * @property int $converted_by
 * @property \Illuminate\Support\Carbon $converted_at
 */
class AcceptanceItemConversion extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'acceptance_item_id',
        'from_method_test_id',
        'to_method_test_id',
        'conversion_type',
        'converted_by',
        'converted_at',
    ];

    protected $casts = [
        'converted_at' => 'datetime',
    ];

    /** @return BelongsTo<AcceptanceItem, $this> */
    public function acceptanceItem(): BelongsTo
    {
        return $this->belongsTo(AcceptanceItem::class);
    }

    /** @return BelongsTo<MethodTest, $this> */
    public function fromMethodTest(): BelongsTo
    {
        return $this->belongsTo(MethodTest::class, 'from_method_test_id');
    }

    /** @return BelongsTo<MethodTest, $this> */
    public function toMethodTest(): BelongsTo
    {
        return $this->belongsTo(MethodTest::class, 'to_method_test_id');
    }

    /** @return BelongsTo<User, $this> */
    public function convertedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'converted_by');
    }
}
