<?php

declare(strict_types=1);

namespace App\Http\Controllers\Attendance;

use App\Domains\Attendance\Exports\AttendanceMonthExport;
use App\Domains\Attendance\Exports\AttendanceSummaryExport;
use App\Domains\Attendance\Models\AttendanceDay;
use App\Domains\Attendance\Requests\ExportAttendanceMonthRequest;
use App\Domains\Attendance\Requests\ExportAttendanceSummaryRequest;
use App\Domains\Attendance\Requests\ShowAttendanceCalendarRequest;
use App\Domains\Attendance\Resources\AttendanceCalendarResource;
use App\Domains\Attendance\Services\AttendanceCalendarService;
use App\Domains\User\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AttendanceCalendarController extends Controller
{
    public function __construct(private readonly AttendanceCalendarService $calendarService) {}

    public function index(ShowAttendanceCalendarRequest $request): Response
    {
        $person = $this->person($request);
        $month = $this->calendarService->month($person->id, $request->firstDayOfMonth());

        return Inertia::render('Attendance/Calendar/Index', [
            'person' => ['id' => $person->id, 'name' => $person->name],
            'calendar' => (new AttendanceCalendarResource($month))->resolve($request),
            'canViewOthers' => Gate::allows('viewAny', AttendanceDay::class),
            'canCorrect' => Gate::allows('correct', AttendanceDay::class),
            'canExportAll' => Gate::allows('export', AttendanceDay::class),
        ]);
    }

    public function export(ExportAttendanceMonthRequest $request): BinaryFileResponse
    {
        $person = $this->person($request);
        $firstDay = $request->firstDayOfMonth();

        return Excel::download(
            new AttendanceMonthExport($person->name, $this->calendarService->month($person->id, $firstDay)),
            'attendance-'.Str::slug($person->name).'-'.$firstDay->format('Y-m').'.xlsx',
        );
    }

    public function exportSummary(ExportAttendanceSummaryRequest $request): BinaryFileResponse
    {
        $firstDay = $request->firstDayOfMonth();

        return Excel::download(
            new AttendanceSummaryExport($firstDay, $this->calendarService->monthSummary($firstDay)),
            'attendance-summary-'.$firstDay->format('Y-m').'.xlsx',
        );
    }

    private function person(ShowAttendanceCalendarRequest $request): User
    {
        $personId = $request->personId();
        if ($personId !== null) {
            return $this->calendarService->findPerson($personId);
        }

        /** @var User $viewer */
        $viewer = $request->user();

        return $viewer;
    }
}
