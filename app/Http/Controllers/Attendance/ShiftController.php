<?php

declare(strict_types=1);

namespace App\Http\Controllers\Attendance;

use App\Domains\Attendance\DTOs\ShiftDTO;
use App\Domains\Attendance\Enums\Weekday;
use App\Domains\Attendance\Models\Shift;
use App\Domains\Attendance\Requests\StoreShiftRequest;
use App\Domains\Attendance\Requests\UpdateShiftRequest;
use App\Domains\Attendance\Resources\ShiftResource;
use App\Domains\Attendance\Services\ShiftService;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class ShiftController extends Controller
{
    public function __construct(private readonly ShiftService $shiftService)
    {
        $this->middleware('indexProvider')->only('index');
    }

    /**
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Shift::class);
        $requestInputs = $request->all();
        // Keep the paginator's top-level `total`/`current_page`, which TableLayout reads.
        $shifts = $this->shiftService->listShifts($requestInputs)
            ->through(fn (Shift $shift) => (new ShiftResource($shift))->resolve($request));

        return Inertia::render('Attendance/Shifts/Index', [
            'shifts' => $shifts,
            'weekdays' => Weekday::options(),
            'requestInputs' => $requestInputs,
        ]);
    }

    public function store(StoreShiftRequest $request): RedirectResponse
    {
        $dto = ShiftDTO::fromArray($request->validated());
        $this->shiftService->storeShift($dto);

        return back()->with(['success' => true, 'status' => "$dto->name created successfully"]);
    }

    public function update(Shift $shift, UpdateShiftRequest $request): RedirectResponse
    {
        $dto = ShiftDTO::fromArray($request->validated());
        $this->shiftService->updateShift($shift, $dto);

        return back()->with(['success' => true, 'status' => "$dto->name updated successfully"]);
    }

    /**
     * @throws AuthorizationException
     */
    public function destroy(Shift $shift): RedirectResponse
    {
        $this->authorize('delete', $shift);
        $name = $shift->name;
        try {
            $this->shiftService->deleteShift($shift);
        } catch (RuntimeException $e) {
            return back()->with(['success' => false, 'status' => $e->getMessage()]);
        }

        return back()->with(['success' => true, 'status' => "$name deleted successfully"]);
    }
}
