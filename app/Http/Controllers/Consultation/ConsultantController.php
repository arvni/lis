<?php

namespace App\Http\Controllers\Consultation;

use App\Domains\Consultation\Services\ConsultantService;
use App\Domains\Consultation\DTOs\ConsultantDTO;
use App\Domains\Consultation\Models\Consultant;
use App\Domains\Consultation\Requests\StoreConsultantRequest;
use App\Domains\Consultation\Requests\UpdateConsultantRequest;
use App\Domains\Consultation\Services\ConsultationService;
use App\Domains\Consultation\Services\TimeService;
use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ConsultantController extends Controller
{
    public function __construct(
        private readonly ConsultantService   $consultantService,
        private readonly TimeService         $timeService,
        private readonly ConsultationService $consultationService
    )
    {
        $this->middleware('indexProvider')->only('index');
    }

    public function index(Request $request): Response
    {
        $this->authorize("viewAny", Consultant::class);
        $consultants = $this->consultantService->listConsultants($request->all());
        return Inertia::render('Consultants/Index', [
            'consultants' => $consultants,
            'requestInputs' => $request->all()
        ]);
    }

    public function create(Request $request): Response
    {
        $this->authorize("create", Consultant::class);
        return Inertia::render('Consultants/Add',);
    }

    public function store(StoreConsultantRequest $request)
    {
        $validated = $request->validated();
        $consultantDto = new ConsultantDTO(
            $validated['user']['id'],
            $validated['name'],
            $validated['title'],
            $validated['speciality'],
            $validated["avatar"],
            $validated['default_time_table'] ?? null,
            $validated['active'] ?? null,
        );
        $this->consultantService->createConsultant($consultantDto);
        return redirect()->route('consultants.index')->with('success', 'Consultant created successfully.');
    }

    /**
     * @param Consultant $consultant
     * @param Request $request
     * @return Response
     * @throws AuthorizationException
     */
    public function show(Consultant $consultant, Request $request): Response
    {
        // Load the consultant with relations
        $this->authorize("view", $consultant);
        $this->consultantService->loadConsultantRelation($consultant);

        $times = $this->timeService->getConsultantTimes($consultant, $request->all());

        $recentConsultations = $this->consultationService->getRecentConsultations([
            "filters" => [
                "consultant_id" => $consultant->id,
                "from_date" => Carbon::now()
            ],
            "limit" => 5
        ]);
        return Inertia::render('Consultants/Show', [
            "times" => $times,
            "consultant" => $consultant,
            "recentConsultations" => $recentConsultations,
        ]);
    }

    public function edit(Consultant $consultant)
    {
        $this->authorize("update", $consultant);
        $consultant->load('user');
        return Inertia::render('Consultants/Edit', [
            'consultant' => $consultant,
        ]);
    }

    public function update(UpdateConsultantRequest $request, Consultant $consultant)
    {
        $validated = $request->validated();
        $consultantDto = new ConsultantDTO(
            $validated['user']['id'],
            $validated['name'],
            $validated['title'],
            $validated['speciality'],
            $validated["avatar"],
            $validated['default_time_table'] ?? null,
            $validated['active'] ?? null,
        );
        $this->consultantService->updateConsultant($consultant, $consultantDto);
        return redirect()->route('consultants.index')->with('success', 'Consultant updated successfully.');
    }

    public function destroy(Consultant $consultant)
    {
        $this->authorize("delete", $consultant);
        $this->consultantService->deleteConsultant($consultant);
        return redirect()->route('consultants.index')->with('success', 'Consultant deleted successfully.');
    }
}
