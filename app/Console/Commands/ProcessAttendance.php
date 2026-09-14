<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Domains\Attendance\Services\AttendanceProcessingService;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class ProcessAttendance extends Command
{
    protected $signature = 'attendance:process
        {--from= : First day to recalculate (YYYY-MM-DD). Defaults to a few days ago}
        {--to= : Last day to recalculate (YYYY-MM-DD). Defaults to today}
        {--user=* : Only these user ids}';

    protected $description = 'Build daily attendance from HikCentral punches, shifts and holidays';

    public function handle(AttendanceProcessingService $processingService): int
    {
        try {
            $today = Carbon::today();
            $from = $this->option('from')
                ? Carbon::parse((string) $this->option('from'))
                : $today->copy()->subDays((int) config('attendance.recompute_days'));
            $to = $this->option('to') ? Carbon::parse((string) $this->option('to')) : $today;
            $userIds = array_values(array_map('intval', (array) $this->option('user')));

            $written = $processingService->rebuild($from, $to, $userIds === [] ? null : $userIds);
            $this->info("Done. {$written} attendance day(s) written for {$from->toDateString()} to {$to->toDateString()}.");

            return self::SUCCESS;
        } catch (\Throwable $e) {
            $this->error("Failed to process attendance: {$e->getMessage()}");
            Log::error('attendance:process failed', ['exception' => $e]);

            return self::FAILURE;
        }
    }
}
