<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Consultation\Models\Consultation;
use App\Domains\Reception\DTOs\PatientDTO;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\Patient;
use App\Domains\Reception\Requests\StorePatientRequest;
use App\Domains\Reception\Requests\UpdatePatientRequest;
use App\Domains\Reception\Services\PatientService;
use App\Domains\User\Services\UserService;
use App\Http\Controllers\Controller;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PatientController extends Controller
{
    public function __construct(private readonly PatientService $patientService)
    {
        $this->middleware("indexProvider")->only("index");
    }

    /**
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize("viewAny", Patient::class);
        $requestInputs = $request->all();
        $patients = $this->patientService->listPatients($requestInputs);
        $stats = $this->patientService->getPatientStats();
        $canDelete = Gate::allows('delete', new Patient());
        return Inertia::render('Patient/Index', compact("patients", "requestInputs", "stats", "canDelete"));
    }

    /**
     * @throws AuthorizationException
     */
    public function create(Request $request): Response
    {
        $this->authorize("create", Patient::class);

        return Inertia::render('Patient/Add', [
            "patient" => $request->session()->get('patient'),
            "relative" => $request->session()->get('relative'),
        ]);
    }

    public function store(StorePatientRequest $request): RedirectResponse
    {
        $validatedData = $request->validated();
        $patientDTO = PatientDTO::fromRequest($validatedData);
        $patient = $this->patientService->createPatient($patientDTO);
        return redirect()->route("patients.show", $patient->id);
    }

    /**
     * @throws AuthorizationException
     */
    public function show(Patient $patient): Response
    {
        $this->authorize("view", $patient);
        $data = $this->patientService->getPatientDetails($patient);
        return Inertia::render('Patient/Show', [
            ...$data,
            "allowedTags" => UserService::getAllowedDocumentTags(),
            "canEdit" => Gate::allows("update", $patient),
            "canCreateAcceptance" => Gate::allows("create", Acceptance::class),
            "canCreateConsultation" => Gate::allows("create", Consultation::class)
        ]);
    }

    public function update(UpdatePatientRequest $request, Patient $patient): RedirectResponse
    {
        $validatedData = $request->validated();
        $patientDTO = PatientDTO::fromRequest($validatedData);
        $this->patientService->updatePatient($patient, $patientDTO);
        return redirect()->route("patients.show", $patient->id)
            ->with(['status' => "$patient->fullName Successfully Updated", "success" => true]);
    }

    /**
     * @throws AuthorizationException
     * @throws Exception
     */
    public function destroy(Patient $patient): RedirectResponse
    {
        $this->authorize("delete", $patient);
        $this->patientService->deletePatient($patient);
        return redirect()->back()->with(["success" => true, "status" => "$patient->fullName successfully deleted"]);
    }
}
