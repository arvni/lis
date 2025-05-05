<?php

namespace App\Http\Controllers\Consultation;

use App\Domains\Consultation\Enums\ConsultationStatus;
use App\Domains\Consultation\Services\ConsultationService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ListWaitingConsultationsController extends Controller
{
    public function __construct(private readonly ConsultationService $consultationService)
    {
        $this->middleware("indexProvider");
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        $requestInputs = $request->all();

        $consultations = $this->consultationService->listConsultations([
            ...$requestInputs,
            "filters" => [
                ...$requestInputs["filters"],
                "status" => [ConsultationStatus::WAITING, ConsultationStatus::BOOKED]
            ]
        ]);
        return Inertia::render("Consultation/Waiting", ["consultations" => $consultations, "requestInputs" => $requestInputs]);
    }
}
