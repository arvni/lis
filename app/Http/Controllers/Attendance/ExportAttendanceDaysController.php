<?php

declare(strict_types=1);

namespace App\Http\Controllers\Attendance;

use App\Domains\Attendance\Exports\AttendanceDaysExport;
use App\Domains\Attendance\Requests\ExportAttendanceDaysRequest;
use App\Domains\Attendance\Services\AttendanceDayService;
use App\Http\Controllers\Controller;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ExportAttendanceDaysController extends Controller
{
    public function __construct(private readonly AttendanceDayService $dayService)
    {
        $this->middleware('indexProvider');
    }

    public function __invoke(ExportAttendanceDaysRequest $request): BinaryFileResponse
    {
        return Excel::download(
            new AttendanceDaysExport($this->dayService->listAllDays($request->all())),
            'attendance-'.now()->format('Y-m-d').'.xlsx',
        );
    }
}
