<?php

namespace App\Domains\Notification\Models;


use Illuminate\Notifications\DatabaseNotification;

/**
 * @property string $id
 * @property string $type
 * @property string $notifiable_type
 * @property int $notifiable_id
 * @property array<array-key, mixed> $data
 * @property \Illuminate\Support\Carbon|null $read_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class Notification extends DatabaseNotification
{

}
