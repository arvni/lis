<?php

declare(strict_types=1);

namespace App\Http\Controllers\Attendance;

use App\Domains\Attendance\DTOs\LeaveKindDTO;
use App\Domains\Attendance\Models\LeaveKind;
use App\Domains\Attendance\Requests\StoreLeaveKindRequest;
use App\Domains\Attendance\Requests\UpdateLeaveKindRequest;
use App\Domains\Attendance\Resources\LeaveKindResource;
use App\Domains\Attendance\Services\LeaveKindService;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class LeaveKindController extends Controller
{
    public function __construct(private readonly LeaveKindService $kindService)
    {
        $this->middleware('indexProvider')->only('index');
    }

    /**
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', LeaveKind::class);
        $requestInputs = $request->all();
        // Keep the paginator's top-level `total`/`current_page`, which TableLayout reads.
        $kinds = $this->kindService->listKinds($requestInputs)
            ->through(fn (LeaveKind $kind) => (new LeaveKindResource($kind))->resolve($request));

        return Inertia::render('Attendance/LeaveKinds/Index', [
            'kinds' => $kinds,
            'requestInputs' => $requestInputs,
        ]);
    }

    public function store(StoreLeaveKindRequest $request): RedirectResponse
    {
        $dto = LeaveKindDTO::fromArray($request->validated());
        $this->kindService->storeKind($dto);

        return back()->with(['success' => true, 'status' => "$dto->name created successfully"]);
    }

    public function update(LeaveKind $leaveKind, UpdateLeaveKindRequest $request): RedirectResponse
    {
        $dto = LeaveKindDTO::fromArray($request->validated());
        $this->kindService->updateKind($leaveKind, $dto);

        return back()->with(['success' => true, 'status' => "$dto->name updated successfully"]);
    }

    /**
     * @throws AuthorizationException
     */
    public function destroy(LeaveKind $leaveKind): RedirectResponse
    {
        $this->authorize('delete', $leaveKind);
        $name = $leaveKind->name;

        try {
            $this->kindService->deleteKind($leaveKind);
        } catch (RuntimeException $e) {
            return back()->with(['success' => false, 'status' => $e->getMessage()]);
        }

        return back()->with(['success' => true, 'status' => "$name deleted successfully"]);
    }
}
