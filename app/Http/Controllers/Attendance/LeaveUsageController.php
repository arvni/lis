<?php

declare(strict_types=1);

namespace App\Http\Controllers\Attendance;

use App\Domains\Attendance\Models\LeaveRequest;
use App\Domains\Attendance\Requests\ShowLeaveUsageRequest;
use App\Domains\Attendance\Resources\LeaveUsageResource;
use App\Domains\Attendance\Services\LeaveUsageService;
use App\Domains\User\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class LeaveUsageController extends Controller
{
    public function __construct(private readonly LeaveUsageService $usageService) {}

    public function index(ShowLeaveUsageRequest $request): Response
    {
        /** @var User $viewer */
        $viewer = $request->user();
        $year = $request->year();
        $shared = [
            'year' => $year,
            'canViewOthers' => Gate::allows('viewUsageOfOthers', LeaveRequest::class),
        ];

        if ($request->wantsStaff()) {
            return Inertia::render('Attendance/LeaveUsage/Index', [
                ...$shared,
                'view' => 'staff',
                'person' => null,
                'usage' => null,
                'staff' => array_map(
                    fn (array $row) => LeaveUsageResource::staffRow($row['user'], $row['usage']),
                    $this->usageService->staffSummary($year),
                ),
            ]);
        }

        $personId = $request->personId();
        $person = $personId === null || $personId === $viewer->id ? $viewer : $this->usageService->findPerson($personId);

        return Inertia::render('Attendance/LeaveUsage/Index', [
            ...$shared,
            'view' => 'person',
            'person' => ['id' => $person->id, 'name' => $person->name],
            'usage' => (new LeaveUsageResource($this->usageService->forPerson($person->id, $year)))->resolve($request),
            'staff' => null,
        ]);
    }
}
