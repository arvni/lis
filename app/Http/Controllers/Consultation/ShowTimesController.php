<?php

namespace App\Http\Controllers\Consultation;

use App\Domains\Consultation\Repositories\TimeRepository;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ShowTimesController extends Controller
{
    public function __construct(private TimeRepository $timeRepository)
    {
        $this->middleware("indexProvider");
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        return Inertia::render('Consultation/Reservations', ["times"=>$this->timeRepository->listTimes($request->all())]);
    }
}
