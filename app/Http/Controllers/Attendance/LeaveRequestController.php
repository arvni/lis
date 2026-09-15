<?php

declare(strict_types=1);

namespace App\Http\Controllers\Attendance;

use App\Domains\Attendance\DTOs\LeaveRequestDTO;
use App\Domains\Attendance\Enums\LeaveRequestStatus;
use App\Domains\Attendance\Models\LeaveRequest;
use App\Domains\Attendance\Requests\CancelLeaveRequestRequest;
use App\Domains\Attendance\Requests\DecideLeaveRequestRequest;
use App\Domains\Attendance\Requests\RejectLeaveRequestRequest;
use App\Domains\Attendance\Requests\StoreLeaveRequestRequest;
use App\Domains\Attendance\Resources\LeaveRequestResource;
use App\Domains\Attendance\Services\LeaveKindService;
use App\Domains\Attendance\Services\LeaveRequestService;
use App\Domains\User\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class LeaveRequestController extends Controller
{
    public function __construct(
        private readonly LeaveRequestService $leaveService,
        private readonly LeaveKindService $kindService,
    ) {
        $this->middleware('indexProvider')->only('index');
    }

    /**
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', LeaveRequest::class);
        /** @var User $viewer */
        $viewer = $request->user();
        $requestInputs = $request->all();
        // Keep the paginator's top-level `total`/`current_page`, which TableLayout reads.
        $requests = $this->leaveService->listRequests($requestInputs, $viewer)
            ->through(fn (LeaveRequest $leave) => (new LeaveRequestResource($leave))->resolve($request));

        return Inertia::render('Attendance/LeaveRequests/Index', [
            'requests' => $requests,
            'kinds' => $this->kindService->activeKinds(),
            'statuses' => LeaveRequestStatus::options(),
            'canManage' => $this->leaveService->isLeaveManager($viewer),
            'requestInputs' => $requestInputs,
        ]);
    }

    public function store(StoreLeaveRequestRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        try {
            $this->leaveService->submit(LeaveRequestDTO::fromArray($request->validated(), $user->id), $user);
        } catch (RuntimeException $e) {
            return back()->withErrors(['start_date' => $e->getMessage()]);
        }

        return back()->with(['success' => true, 'status' => 'Leave request sent for approval']);
    }

    public function approve(LeaveRequest $leaveRequest, DecideLeaveRequestRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        try {
            $this->leaveService->approve($leaveRequest, $user, $request->validated('notes'));
        } catch (RuntimeException $e) {
            return back()->with(['success' => false, 'status' => $e->getMessage()]);
        }

        return back()->with(['success' => true, 'status' => 'Your approval was recorded']);
    }

    public function reject(LeaveRequest $leaveRequest, RejectLeaveRequestRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        try {
            $this->leaveService->reject($leaveRequest, $user, (string) $request->validated('notes'));
        } catch (RuntimeException $e) {
            return back()->with(['success' => false, 'status' => $e->getMessage()]);
        }

        return back()->with(['success' => true, 'status' => 'Leave request rejected']);
    }

    public function cancel(LeaveRequest $leaveRequest, CancelLeaveRequestRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        try {
            $this->leaveService->cancel($leaveRequest, $user, $request->validated('reason'));
        } catch (RuntimeException $e) {
            return back()->with(['success' => false, 'status' => $e->getMessage()]);
        }

        return back()->with(['success' => true, 'status' => 'Leave request cancelled']);
    }
}
