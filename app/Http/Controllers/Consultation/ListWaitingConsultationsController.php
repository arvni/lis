<?php

namespace App\Http\Controllers\Consultation;

use App\Domains\Consultation\Enums\ConsultationStatus;
use App\Domains\Consultation\Models\Consultant;
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

        if (!$request->query('sort')) {
            $requestInputs['sort'] = ['field' => 'dueDate', 'sort' => 'asc'];
        }

        $consultations = $this->consultationService->listConsultations([
            ...$requestInputs,
            "filters" => [
                ...$requestInputs["filters"],
                "status" => [ConsultationStatus::WAITING, ConsultationStatus::BOOKED]
            ]
        ]);

        $consultants = Consultant::query()
            ->where('active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'title']);

        return Inertia::render("Consultation/Waiting", [
            "consultations" => $consultations,
            "requestInputs" => $requestInputs,
            "consultants" => $consultants,
        ]);
    }
}
