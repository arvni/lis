<?php

namespace App\Http\Controllers;

use App\Domains\Consultation\Models\Time;
use App\Domains\Consultation\Repositories\TimeRepository;
use App\Http\Requests\StoreTimeRequest;;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TimeController extends Controller
{
    public function __construct(private readonly TimeRepository $timeRepository)
    {
        $this->middleware("indexProvider")->only("index");
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        return Inertia::render('Consultation/Reservations', ["times"=>$this->timeRepository->listTimes($request->all())]);
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreTimeRequest $request)
    {
        $validated = $request->validated();
        $startTime = Carbon::createFromFormat("Y-m-d H:i", $validated["date"] . " " . $validated["startTime"], "Asia/Muscat");
        $endTime = Carbon::createFromFormat("Y-m-d H:i", $validated["date"] . " " . $validated["endTime"], "Asia/Muscat");
        $this->timeRepository->createTime([
            "consultant_id" => $validated["consultant_id"],
            "title" => "Reserved Disabled Time By Doctor",
            "started_at" => $startTime,
            "ended_at" => $endTime,
            "active" => false,
        ]);
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
     */
    public function destroy(Time $time)
    {
        //
    }
}
