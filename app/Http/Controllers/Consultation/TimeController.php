<?php

namespace App\Http\Controllers\Consultation;

use App\Domains\Consultation\DTOs\TimeDTO;
use App\Domains\Consultation\Enums\ConsultationStatus;
use App\Domains\Consultation\Models\Time;
use App\Domains\Consultation\Services\ConsultationService;
use App\Domains\Consultation\Services\TimeService;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTimeRequest;
use Carbon\Carbon;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class TimeController extends Controller
{
    public function __construct(
        private readonly TimeService $timeService,

        private readonly ConsultationService  $consultationService
    )
    {
        $this->middleware("indexProvider")->only("index");
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        return Inertia::render('Consultation/Reservations', [
            "times" => $this->timeService->listTimes($request->all()),
            "canAdd" => Gate::allows('create', Time::class),
            "canEdit" => Gate::allows('edit', new Time()),
            "canDelete" => Gate::allows('delete', new Time()),
        ]);
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreTimeRequest $request)
    {
        $validated = $request->validated();
        $startTime = Carbon::createFromFormat("Y-m-d H:i", $validated["date"] . " " . $validated["startTime"], "Asia/Muscat");
        $endTime = Carbon::createFromFormat("Y-m-d H:i", $validated["date"] . " " . $validated["endTime"], "Asia/Muscat");
        $this->timeService->storeTime(new TimeDTO(
            "Reserved Disabled Time By Doctor",
            $validated["consultant_id"],
            $startTime,
            $endTime,
            false,
        ));
        return back()->with(["success" => true, "status" => "Time added successfully"]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Time $time)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     * @throws AuthorizationException
     * @throws Exception
     */
    public function destroy(Time $time): RedirectResponse
    {
        $this->authorize("delete", $time);
        $time->load("reservable");
        if ($time->reservable_type == "consultation" && $time->reservable->status == ConsultationStatus::BOOKED) {
            $this->consultationService->deleteConsultation($time->reservable);
            $this->timeService->deleteTime($time);
        } elseif ($time->reservable_type == "customer")
            $this->timeService->deleteTime($time);
        else
            return back()->withErrors("This reservation cannot be deleted because the consultation has already taken place.");
        return back()->with(["success" => true, "status" => "Reservation removed successfully"]);
    }
}
