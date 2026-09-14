<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Listeners;

use App\Domains\Attendance\Events\AttendanceRebuildRequested;
use App\Domains\Attendance\Services\AttendanceProcessingService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Carbon;

/**
 * Recalculates the affected days off the request path; a back-dated change can cover months.
 */
class RebuildAttendanceDays implements ShouldQueue
{
    use InteractsWithQueue;

    public int $tries = 3;

    public function __construct(private readonly AttendanceProcessingService $processingService) {}

    public function handle(AttendanceRebuildRequested $event): void
    {
        $this->processingService->rebuild(
            Carbon::parse($event->from),
            Carbon::parse($event->to),
            $event->userIds,
        );
    }
}
