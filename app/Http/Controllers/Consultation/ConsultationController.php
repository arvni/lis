<?php

namespace App\Http\Controllers\Consultation;

use App\Domains\Consultation\DTOs\ConsultationDTO;
use App\Domains\Consultation\DTOs\TimeDTO;
use App\Domains\Consultation\Enums\ConsultationStatus;
use App\Domains\Consultation\Models\Consultation;
use App\Domains\Consultation\Requests\StoreConsultationRequest;
use App\Domains\Consultation\Requests\UpdateConsultationRequest;
use App\Domains\Consultation\Services\ConsultationService;
use App\Domains\Consultation\Services\TimeService;
use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ConsultationController extends Controller
{
    public function __construct(
        private readonly ConsultationService $consultationService,
        private readonly TimeService         $timeService,
    )
    {
        $this->middleware("indexProvider")->only("index");
    }

    /**
     * Display a listing of the resource.
     * @param Request $request
     * @return Response
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize("viewAny", Consultation::class);
        $requestInputs = $request->all();
        $consultations = $this->consultationService->listConsultations($requestInputs);
        return Inertia::render("Consultation/Index", ["consultations" => $consultations, "requestInputs" => $requestInputs]);
    }


    /**
     * Store a newly created resource in storage.
     * @param StoreConsultationRequest $request
     * @return RedirectResponse
     */
    public function store(StoreConsultationRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $consultation = $this->consultationService->createConsultation(ConsultationDTO::fromRequest($validated));
        if ($request->has("time")) {
            $dueDate = Carbon::parse($consultation->dueDate, "Asia/Muscat");
            $this->timeService->storeTime(
                new TimeDTO(
                    $dueDate->format("H:i"),
                    $consultation->consultant_id,
                    $dueDate,
                    $dueDate->copy()->addMinutes(30),
                    true,
                    "consultation",
                    $consultation->id
                )
            );
        }

        return back()->with(["success" => true, "status" => "Consultation created successfully.", "consultation" => $consultation]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Consultation $consultation)
    {
        $consultation->load(["patient", "consultant"]);
        return Inertia::render("Consultation/Show", [
            "patient" => $consultation->patient,
            "consultant" => $consultation->consultant,
            "consultation" => $consultation,
            "canEdit" => Gate::allows("update", $consultation)
        ]);
    }


    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateConsultationRequest $request, Consultation $consultation): RedirectResponse
    {
        $consultationDto = ConsultationDTO::fromConsultation($consultation);
        $consultationDto->information = $request->information;
        $consultationDto->status = ConsultationStatus::DONE;
        $this->consultationService->updateConsultation($consultation, $consultationDto);
        return redirect()->back()->with(["consultation" => $consultation]);
    }

    /**
     * Remove the specified resource .
     * @param Consultation $consultation
     * @return RedirectResponse
     * @throws Exception
     */
    public function destroy(Consultation $consultation): RedirectResponse
    {
        if ($consultation->acceptance()->exists())
            return back()->withErrors("Consultation is exists in an acceptance.");
        $this->consultationService->deleteConsultation($consultation);
        return redirect()->back()->with(["success" => true, "status" => "Consultation deleted successfully.",]);
    }
}
