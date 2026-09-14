<?php

declare(strict_types=1);

namespace App\Http\Controllers\Attendance\Api;

use App\Domains\Attendance\Models\AttendanceDay;
use App\Domains\Attendance\Services\AttendanceCalendarService;
use App\Http\Controllers\Controller;
use App\Http\Resources\ListResource;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * People whose attendance calendar the viewer may open.
 */
class ListCalendarPeopleController extends Controller
{
    public function __construct(private readonly AttendanceCalendarService $calendarService) {}

    /**
     * @throws AuthorizationException
     */
    public function __invoke(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', AttendanceDay::class);
        $search = $request->string('search')->trim()->toString();

        return ListResource::collection($this->calendarService->searchPeople($search !== '' ? $search : null));
    }
}
