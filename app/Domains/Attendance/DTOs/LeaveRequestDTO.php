<?php

declare(strict_types=1);

namespace App\Domains\Attendance\DTOs;

use App\Domains\Attendance\Enums\LeaveType;

class LeaveRequestDTO
{
    public function __construct(
        public int $userId,
        public int $leaveKindId,
        public LeaveType $type,
        public string $startDate,
        public string $endDate,
        public ?string $startTime,
        public ?string $endTime,
        public ?string $reason,
    ) {}

    /**
     * @param  array<string, mixed>  $data  validated input
     * @param  int  $defaultUserId  the person taking the leave when nobody else is named
     */
    public static function fromArray(array $data, int $defaultUserId): self
    {
        $type = LeaveType::from((string) $data['type']);
        $hourly = $type === LeaveType::HOURLY;

        return new self(
            isset($data['user_id']) ? (int) $data['user_id'] : $defaultUserId,
            (int) $data['leave_kind_id'],
            $type,
            $data['start_date'],
            // Hourly leave sits within one day.
            $hourly ? $data['start_date'] : $data['end_date'],
            $hourly ? $data['start_time'] : null,
            $hourly ? $data['end_time'] : null,
            $data['reason'] ?? null,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'user_id' => $this->userId,
            'leave_kind_id' => $this->leaveKindId,
            'type' => $this->type,
            'start_date' => $this->startDate,
            'end_date' => $this->endDate,
            'start_time' => $this->startTime,
            'end_time' => $this->endTime,
            'reason' => $this->reason,
        ];
    }
}
