<?php

declare(strict_types=1);

namespace App\Http\Controllers\Attendance;

use App\Domains\Attendance\DTOs\UserShiftDTO;
use App\Domains\Attendance\Models\UserShift;
use App\Domains\Attendance\Requests\StoreUserShiftRequest;
use App\Domains\Attendance\Resources\UserShiftResource;
use App\Domains\Attendance\Services\UserShiftService;
use App\Domains\User\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use RuntimeException;

/**
 * JSON endpoints behind the shift panel on the user edit page.
 */
class UserShiftController extends Controller
{
    public function __construct(private readonly UserShiftService $userShiftService) {}

    /**
     * @throws AuthorizationException
     */
    public function index(User $user): AnonymousResourceCollection
    {
        $this->authorize('viewAny', UserShift::class);

        return UserShiftResource::collection($this->userShiftService->listAssignments($user->id));
    }

    public function store(User $user, StoreUserShiftRequest $request): JsonResponse
    {
        try {
            $assignment = $this->userShiftService->assign($user->id, UserShiftDTO::fromArray($request->validated()));
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage(), 'errors' => ['effective_from' => [$e->getMessage()]]], 422);
        }

        return (new UserShiftResource($assignment))->response()->setStatusCode(201);
    }

    /**
     * @throws AuthorizationException
     */
    public function destroy(User $user, UserShift $userShift): JsonResponse
    {
        abort_unless($userShift->user_id === $user->id, 404);
        $this->authorize('delete', $userShift);

        try {
            $this->userShiftService->removeAssignment($userShift);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['message' => 'Shift assignment removed.']);
    }
}
