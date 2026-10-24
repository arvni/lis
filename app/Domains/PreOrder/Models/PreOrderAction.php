<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Models;

use App\Domains\PreOrder\Enums\ActionStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * A center action written by the api app. The LIS is the only thing that applies it.
 *
 * @property int $id
 * @property string $uuid
 * @property int $referrer_id
 * @property int|null $pre_order_id
 * @property string $type
 * @property array<string, mixed> $payload
 * @property array{user_id?: int|string, name?: string} $actor
 * @property ActionStatus $status
 * @property string|null $error
 * @property Carbon|null $processed_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class PreOrderAction extends Model
{
    protected $fillable = [
        'uuid', 'referrer_id', 'pre_order_id', 'type', 'payload', 'actor', 'status', 'error', 'processed_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'actor' => 'array',
        'status' => ActionStatus::class,
        'processed_at' => 'datetime',
    ];

    /** @return BelongsTo<PreOrder, $this> */
    public function preOrder(): BelongsTo
    {
        return $this->belongsTo(PreOrder::class);
    }
}
