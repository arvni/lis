<?php

declare(strict_types=1);

use App\Domains\Attendance\Enums\AttendanceStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendance_days', function (Blueprint $table) {
            // Minutes at work outside the shift: before it starts and after it ends. On a day off or a
            // holiday, all of the worked time.
            $table->unsignedSmallInteger('overtime_minutes')->default(0)->after('worked_minutes');
        });

        // Fill in days already recorded, including ones corrected by hand, which the scheduled job
        // never recalculates.
        DB::table('attendance_days')
            ->whereNotNull('check_in')
            ->whereNotNull('check_out')
            ->chunkById(500, function (Collection $days) {
                foreach ($days as $day) {
                    $overtime = $this->overtimeOf($day);
                    if ($overtime > 0) {
                        DB::table('attendance_days')->where('id', $day->id)->update(['overtime_minutes' => $overtime]);
                    }
                }
            });
    }

    public function down(): void
    {
        Schema::table('attendance_days', function (Blueprint $table) {
            $table->dropColumn('overtime_minutes');
        });
    }

    /**
     * The same rule as AttendanceDayCalculator, kept here so the migration doesn't change with it.
     */
    private function overtimeOf(object $day): int
    {
        if (in_array($day->status, [AttendanceStatus::HOLIDAY->value, AttendanceStatus::OFF->value], true)) {
            return (int) $day->worked_minutes;
        }
        if ($day->scheduled_start === null || $day->scheduled_end === null) {
            return 0;
        }

        $date = substr((string) $day->date, 0, 10);
        $in = Carbon::parse($day->check_in)->getTimestamp();
        $out = Carbon::parse($day->check_out)->getTimestamp();
        $start = Carbon::parse("$date $day->scheduled_start")->getTimestamp();
        $end = Carbon::parse("$date $day->scheduled_end")->getTimestamp();

        $before = intdiv(max(0, min($out, $start) - $in), 60);
        $after = intdiv(max(0, $out - max($in, $end)), 60);

        return min(65535, $before + $after);
    }
};
