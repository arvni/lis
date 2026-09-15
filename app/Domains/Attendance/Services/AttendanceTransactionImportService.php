<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Services;

use App\Domains\Attendance\Adapters\UserAdapter;
use App\Domains\Attendance\DTOs\ParsedPunch;
use App\Domains\Attendance\DTOs\PunchImportResult;
use App\Domains\Attendance\Events\AttendanceRebuildRequested;
use App\Domains\Attendance\Imports\PunchesImport;
use App\Domains\Attendance\Repositories\AttendanceTransactionRepository;
use App\Domains\Attendance\Support\PunchSheetParser;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Maatwebsite\Excel\Facades\Excel;
use RuntimeException;
use Throwable;

/**
 * Adds punches from an Excel or CSV file, for days HikCentral could not write them itself.
 */
class AttendanceTransactionImportService
{
    public function __construct(
        private readonly PunchSheetParser $parser,
        private readonly AttendanceTransactionRepository $transactionRepository,
        private readonly UserAdapter $userAdapter,
    ) {}

    /**
     * Punches already stored (same Employee ID, same second) are skipped, so a file can be imported
     * again safely, e.g. after fixing the rows it rejected. Rows that can't be read are reported and
     * the rest are still imported. Affected attendance days are recalculated in the background.
     *
     * @throws RuntimeException when the file isn't a readable spreadsheet or has no recognisable headings
     */
    public function import(UploadedFile $file, int $importedBy, ?Carbon $now = null): PunchImportResult
    {
        $now ??= Carbon::now();
        $sheet = $this->parser->parse($this->readRows($file), $now);
        $new = $this->withoutStoredPunches($sheet->punches);

        $createdAt = $now->format('Y-m-d H:i:s');
        $this->transactionRepository->insertMany(array_map(fn (ParsedPunch $punch) => [
            'attendance_id' => $punch->attendanceId,
            'access_date_and_time' => $punch->at->format('Y-m-d H:i:s'),
            'access_date' => $punch->at->format('Y-m-d'),
            'access_time' => $punch->at->format('H:i:s'),
            'imported_by' => $importedBy,
            'created_at' => $createdAt,
        ], $new));

        $attendanceIds = array_values(array_unique(array_map(fn (ParsedPunch $punch) => $punch->attendanceId, $new)));
        $users = $this->userAdapter->getUsersByAttendanceNumbers($attendanceIds);

        if ($users !== []) {
            $dates = array_map(fn (ParsedPunch $punch) => $punch->at->toDateString(), $new);
            $userIds = [];
            foreach ($users as $user) {
                $userIds[] = $user->id;
            }
            AttendanceRebuildRequested::dispatch(min($dates), max($dates), $userIds);
        }

        return new PunchImportResult(
            imported: count($new),
            duplicates: count($sheet->punches) - count($new),
            errors: $sheet->errors,
            columns: $sheet->columns,
            unmatchedIds: array_values(array_filter(
                $attendanceIds,
                fn (string $attendanceId) => ! isset($users[$attendanceId]),
            )),
        );
    }

    /**
     * @return list<list<mixed>>
     */
    private function readRows(UploadedFile $file): array
    {
        $import = new PunchesImport;

        try {
            Excel::import($import, $file);
        } catch (Throwable $e) {
            throw new RuntimeException("The file couldn't be read. Save it as .xlsx or .csv and try again.", previous: $e);
        }

        return $import->rows();
    }

    /**
     * @param  list<ParsedPunch>  $punches
     * @return list<ParsedPunch> each punch not stored yet, once
     */
    private function withoutStoredPunches(array $punches): array
    {
        if ($punches === []) {
            return [];
        }

        $times = array_map(fn (ParsedPunch $punch) => $punch->at, $punches);
        $attendanceIds = array_values(array_unique(array_map(fn (ParsedPunch $punch) => $punch->attendanceId, $punches)));

        $seen = [];
        foreach ($this->transactionRepository->punchesBetween(min($times), max($times), $attendanceIds) as $stored) {
            $seen[$stored->attendance_id.'|'.$stored->access_date_and_time->format('Y-m-d H:i:s')] = true;
        }

        $new = [];
        foreach ($punches as $punch) {
            $key = $punch->attendanceId.'|'.$punch->at->format('Y-m-d H:i:s');
            if (! isset($seen[$key])) {
                $seen[$key] = true;
                $new[] = $punch;
            }
        }

        return $new;
    }
}
