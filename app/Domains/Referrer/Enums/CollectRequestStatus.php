<?php

namespace App\Domains\Referrer\Enums;

enum CollectRequestStatus: string
{
    case PENDING = "pending";
    case WAITING_FOR_ASSIGN = "waiting_for_assign";
    case SAMPLE_COLLECTOR_ON_THE_WAY = "sample_collector_on_the_way";
    case PICKED_UP = "picked_up";
    case RECEIVED = "received";

    /**
     * Get all status values as array
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Get human-readable label for the status
     */
    public function label(): string
    {
        return match($this) {
            self::PENDING => 'Pending',
            self::WAITING_FOR_ASSIGN => 'Waiting for Assignment',
            self::SAMPLE_COLLECTOR_ON_THE_WAY => 'Sample Collector On The Way',
            self::PICKED_UP => 'Picked Up',
            self::RECEIVED => 'Received',
        };
    }
}
