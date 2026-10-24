<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Models;

use App\Domains\PreOrder\Enums\HistoryType;
use App\Domains\PreOrder\Enums\Side;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Append-only: rows are written by PreOrderWorkflow and never edited.
 *
 * @property int $id
 * @property int $pre_order_id
 * @property HistoryType $type
 * @property string|null $from_stage
 * @property string|null $to_stage
 * @property string|null $body
 * @property bool $internal
 * @property int|null $user_id
 * @property Side $side
 * @property string|null $actor_name
 * @property array<string, mixed>|null $meta
 * @property Carbon|null $created_at
 */
class PreOrderHistory extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'pre_order_id', 'type', 'from_stage', 'to_stage', 'body', 'internal', 'user_id', 'side',
        'actor_name', 'meta',
    ];

    protected $casts = [
        'type' => HistoryType::class,
        'side' => Side::class,
        'internal' => 'boolean',
        'meta' => 'array',
    ];

    /** @return BelongsTo<PreOrder, $this> */
    public function preOrder(): BelongsTo
    {
        return $this->belongsTo(PreOrder::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
