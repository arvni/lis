<?php

declare(strict_types=1);

namespace App\Http\Controllers\Attendance\Api;

use App\Domains\Attendance\Models\UserShift;
use App\Domains\Attendance\Services\ShiftService;
use App\Http\Controllers\Controller;
use App\Http\Resources\ListResource;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Active shifts for the shift picker on the user edit page.
 */
class ListActiveShiftsController extends Controller
{
    public function __construct(private readonly ShiftService $shiftService) {}

    /**
     * @throws AuthorizationException
     */
    public function __invoke(Request $request): AnonymousResourceCollection
    {
        $this->authorize('create', UserShift::class);
        $search = $request->string('search')->trim()->toString();

        return ListResource::collection($this->shiftService->listActiveShiftsForSelect($search !== '' ? $search : null));
    }
}
