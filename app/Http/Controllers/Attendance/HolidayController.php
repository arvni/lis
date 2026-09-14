<?php

declare(strict_types=1);

namespace App\Http\Controllers\Attendance;

use App\Domains\Attendance\DTOs\HolidayDTO;
use App\Domains\Attendance\Models\Holiday;
use App\Domains\Attendance\Requests\StoreHolidayRequest;
use App\Domains\Attendance\Requests\UpdateHolidayRequest;
use App\Domains\Attendance\Resources\HolidayResource;
use App\Domains\Attendance\Services\HolidayService;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HolidayController extends Controller
{
    public function __construct(private readonly HolidayService $holidayService)
    {
        $this->middleware('indexProvider')->only('index');
    }

    /**
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Holiday::class);
        $requestInputs = $request->all();
        // Keep the paginator's top-level `total`/`current_page`, which TableLayout reads.
        $holidays = $this->holidayService->listHolidays($requestInputs)
            ->through(fn (Holiday $holiday) => (new HolidayResource($holiday))->resolve($request));

        return Inertia::render('Attendance/Holidays/Index', [
            'holidays' => $holidays,
            'requestInputs' => $requestInputs,
        ]);
    }

    public function store(StoreHolidayRequest $request): RedirectResponse
    {
        $dto = HolidayDTO::fromArray($request->validated());
        $this->holidayService->storeHoliday($dto);

        return back()->with(['success' => true, 'status' => "$dto->title added successfully"]);
    }

    public function update(Holiday $holiday, UpdateHolidayRequest $request): RedirectResponse
    {
        $dto = HolidayDTO::fromArray($request->validated());
        $this->holidayService->updateHoliday($holiday, $dto);

        return back()->with(['success' => true, 'status' => "$dto->title updated successfully"]);
    }

    /**
     * @throws AuthorizationException
     */
    public function destroy(Holiday $holiday): RedirectResponse
    {
        $this->authorize('delete', $holiday);
        $title = $holiday->title;
        $this->holidayService->deleteHoliday($holiday);

        return back()->with(['success' => true, 'status' => "$title deleted successfully"]);
    }
}
