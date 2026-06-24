<?php

namespace App\Domains\Notification\Models;

use App\Domains\Notification\Enums\WhatsappMessageType;
use App\Domains\Notification\Enums\WhatsappMessageWritten;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * @property int $id
 * @property int|null $replied_to_id
 * @property string|null $messageable_type
 * @property int|null $messageable_id
 * @property string|null $sid
 * @property string $waId
 * @property \App\Domains\Notification\Enums\WhatsappMessageType $type
 * @property \App\Domains\Notification\Enums\WhatsappMessageWritten $written
 * @property array<array-key, mixed> $data
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class WhatsappMessage extends Model
{
    use Searchable;

    protected $fillable = [
        'replied_to_id',
        'messageable_id',
        'messageable_type',
        'related_id',
        'related_type',
        'sid',
        'waId',
        'type',
        'written',
        'data',
        'status',
    ];

    protected $casts = [
        "data" => "json",
        'type' => WhatsappMessageType::class,
        'written' => WhatsappMessageWritten::class,
    ];

    protected $seachable = [
        "waId",
        "messageable.fullName",
        "messageable.phone",
    ];

    public function messageable(): MorphTo
    {
        return $this->morphTo();
    }

    public function related(): MorphTo
    {
        return $this->morphTo();
    }

}
