<?php

declare(strict_types=1);

namespace App\Http\Controllers\Attendance;

use App\Domains\Attendance\DTOs\AttendanceCorrectionDTO;
use App\Domains\Attendance\Enums\AttendanceStatus;
use App\Domains\Attendance\Models\AttendanceDay;
use App\Domains\Attendance\Requests\CorrectAttendanceDayRequest;
use App\Domains\Attendance\Resources\AttendanceDayResource;
use App\Domains\Attendance\Services\AttendanceDayService;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceDayController extends Controller
{
    public function __construct(private readonly AttendanceDayService $dayService)
    {
        $this->middleware('indexProvider')->only('index');
    }

    /**
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', AttendanceDay::class);
        $requestInputs = $request->all();
        // Keep the paginator's top-level `total`/`current_page`, which TableLayout reads.
        $days = $this->dayService->listDays($requestInputs)
            ->through(fn (AttendanceDay $day) => (new AttendanceDayResource($day))->resolve($request));

        return Inertia::render('Attendance/Days/Index', [
            'days' => $days,
            'statuses' => AttendanceStatus::options(),
            'requestInputs' => $requestInputs,
        ]);
    }

    public function update(AttendanceDay $attendanceDay, CorrectAttendanceDayRequest $request): RedirectResponse
    {
        $this->dayService->correct(
            $attendanceDay,
            AttendanceCorrectionDTO::fromArray($request->validated()),
            (int) $request->user()?->getAuthIdentifier(),
        );

        return back()->with(['success' => true, 'status' => 'Attendance for '.$attendanceDay->date->format('Y-m-d').' corrected']);
    }

    /**
     * @throws AuthorizationException
     */
    public function reset(AttendanceDay $attendanceDay): RedirectResponse
    {
        $this->authorize('update', $attendanceDay);
        $date = $attendanceDay->date->format('Y-m-d');
        $this->dayService->resetToAutomatic($attendanceDay);

        return back()->with(['success' => true, 'status' => "Attendance for $date recalculated from punches"]);
    }
}
