<?php

declare(strict_types=1);

namespace App\Domains\Notification\Resources;

use App\Domains\Notification\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

/**
 * Flattens a database notification for the UI.
 *
 * The payload each notification writes lives in the `data` JSON column, so the
 * bell and the notifications page get `title`/`message`/`url` hoisted to the
 * top level, plus a boolean `read` (the column is the nullable `read_at`).
 *
 * @mixin Notification
 */
class NotificationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var array<string, mixed> $data */
        $data = is_array($this->data) ? $this->data : [];

        return [
            'id' => $this->id,
            // Human label for the chip; `type_key` is the value the type filter sends back.
            'type' => self::labelFor($this->type),
            'type_key' => $this->type,
            'title' => $data['title'] ?? self::labelFor($this->type),
            'message' => $data['message'] ?? null,
            'url' => $data['url'] ?? $data['link'] ?? null,
            'read' => $this->read_at !== null,
            'read_at' => $this->read_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'time' => $this->created_at?->diffForHumans(),
            'data' => $data,
        ];
    }

    /**
     * Turn a notification class name into something readable, e.g.
     * `…\PurchaseRequestApprovedNotification` → "Purchase Request Approved".
     */
    public static function labelFor(?string $notificationClass): string
    {
        if ($notificationClass === null || $notificationClass === '') {
            return 'Notification';
        }

        $base = Str::of(class_basename($notificationClass))->replaceLast('Notification', '');

        return $base->isEmpty() ? 'Notification' : (string) $base->headline();
    }
}
