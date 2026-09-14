<?php

declare(strict_types=1);

namespace App\Http\Controllers\Attendance\Api;

use App\Domains\Attendance\Models\LeaveRequest;
use App\Domains\Attendance\Services\LeaveRequestService;
use App\Http\Controllers\Controller;
use App\Http\Resources\ListResource;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * People a leave manager can enter leave for.
 */
class ListLeavePeopleController extends Controller
{
    public function __construct(private readonly LeaveRequestService $leaveService) {}

    /**
     * @throws AuthorizationException
     */
    public function __invoke(Request $request): AnonymousResourceCollection
    {
        $this->authorize('createForOthers', LeaveRequest::class);
        $search = $request->string('search')->trim()->toString();

        return ListResource::collection($this->leaveService->searchPeople($search !== '' ? $search : null));
    }
}
