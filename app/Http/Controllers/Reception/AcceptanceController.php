<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Notifications\WelcomeNotification;
use App\Domains\Reception\Requests\StoreAcceptanceRequest;
use App\Domains\Reception\Requests\UpdateAcceptanceRequest;
use App\Domains\Reception\DTOs\AcceptanceDTO;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\Patient;
use App\Domains\Reception\Services\AcceptanceService;
use App\Domains\Setting\Repositories\SettingRepository;
use App\Http\Controllers\Controller;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class AcceptanceController extends Controller
{
    public function __construct(private readonly AcceptanceService $acceptanceService,
                                private readonly SettingRepository $settingRepository)
    {
        $this->middleware("indexProvider")->only("index");
    }

    /**
     * Display a listing of the resource.
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize("viewAny", Acceptance::class);
        $requestInputs = $request->all();

        $acceptances = $this->acceptanceService->listAcceptances($requestInputs);
        $acceptance = new Acceptance();
        return Inertia::render('Acceptance/Index',
            [
                "acceptances" => $acceptances,
                "requestInputs" => $requestInputs,
                "canView" => Gate::allows("view", Acceptance::class),
                "canUpdate" => Gate::allows("update", $acceptance),
                "canDelete" => Gate::allows("delete", $acceptance),
                "canCancel" => Gate::allows("cancel", $acceptance)
            ]);
    }

    /**
     * @throws AuthorizationException
     */
    public function create(Patient $patient, Request $request): RedirectResponse|Response
    {
        $this->authorize("create", Acceptance::class);
        $acceptance = $this->acceptanceService->getPendingAcceptance($patient);
        if ($acceptance) {
            return redirect()->route("acceptances.edit", $acceptance->id);
        }
        if ($request->session()->has("consultation")) {
            $acceptance = $this->acceptanceService->storeAcceptance(new AcceptanceDTO(
                $patient->id,
                2,
                $request->session()->get("consultation")->id,
                null,
                null,
                null,
                auth()->user()->id,
                null,
                null,
                null,
                null,
                [],
                AcceptanceStatus::PENDING,
            ));
            return redirect()->route("acceptances.edit", $acceptance);
        }
        $maxDiscount = $this->settingRepository->getSettingsByClassAndKey('Payment', 'maxDiscount');

        return Inertia::render('Acceptance/Add', ["patient" => $patient, "maxDiscount" => $maxDiscount]);
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreAcceptanceRequest $acceptanceRequest, Patient $patient): RedirectResponse
    {
        $validatedData = $acceptanceRequest->validated();
        $acceptanceDto = new AcceptanceDTO(
            $patient->id,
            3,
            null,
            $acceptanceRequest->get("doctor")["id"] ?? null,
            null,
            $validatedData["referred"] ? $validatedData["referrer"]["id"] : null,
            auth()->user()->id,
            $validatedData["referenceCode"] ?? null,
            $validatedData["samplerGender"] ?? null,
            $validatedData["howReport"] ?? [],
            $validatedData["doctor"] ?? null,
            $validatedData["acceptanceItems"] ?? [],
            AcceptanceStatus::PENDING,
            $validatedData["out_patient"] ?? false,
        );
        $acceptance = $this->acceptanceService->storeAcceptance($acceptanceDto);

        return redirect()->route("acceptances.edit", $acceptance->id)
            ->with(["success" => true, "status" => "Created Successfully"]);
    }

    public function show(Acceptance $acceptance): Response
    {
        if ($acceptance->status == AcceptanceStatus::PENDING) {
            abort(403, "This Acceptance Didnt Completely Registered Yet");
        }
        $acceptance = $this->acceptanceService->showAcceptance($acceptance);
        $data = [
            "acceptance" => array_merge(Arr::except($acceptance->toArray(), [
                "acceptance_items",
                "invoice",
                "payments",
                "prescription",
                "patient",

            ]),
                ([
                    "acceptance_items" => $this->acceptanceService->organizeAcceptanceItems($acceptance->acceptanceItems->toArray()),
                    "prescription" => $acceptance->prescription ? [
                        "id" => $acceptance->prescription->hash,
                        'originalName' => $acceptance->prescription->originalName
                    ] : null,
                ])),
            "patient" => $acceptance->patient,
            "acceptanceItems" => $acceptance->acceptanceItems,
            "invoice" => $acceptance->invoice,
            "minAllowablePayment",
            "canEdit" => Gate::allows("update", $acceptance),
            "canPrintBarcode" => $acceptance->status === AcceptanceStatus::PROCESSING || $acceptance->status === AcceptanceStatus::REPORTED || $acceptance->status === AcceptanceStatus::WAITING_FOR_ENTERING,
        ];
        return Inertia::render('Acceptance/Show', $data);
    }


    /**
     * edit a created resource in storage.
     * @throws AuthorizationException
     */
    public function edit(Acceptance $acceptance, Request $request): Response
    {
        $this->authorize("update", $acceptance);
        // Get acceptance data with organized items from service
        $acceptanceData = $this->acceptanceService->prepareAcceptanceForEdit($acceptance);
        $maxDiscount = $this->settingRepository->getSettingsByClassAndKey('Payment', 'maxDiscount');
        return Inertia::render('Acceptance/Edit', [
            "acceptance" => $acceptanceData,
            "maxDiscount" => $maxDiscount
        ]);
    }


    /**
     * Update the specified resource in storage.
     */
    public function update(Acceptance $acceptance, UpdateAcceptanceRequest $request): RedirectResponse
    {
        $status = $acceptance->status;
        // Get validated data
        $validatedData = $request->validated();
        // Get current step
        $currentStep = $validatedData['step'] ?? 5;

        // Check if this is a final submission
        $isFinalStep = (int)$currentStep >= 5;
        try {
            // Update the acceptance
            $updatedAcceptance = $this->acceptanceService->updateAcceptance($acceptance, $validatedData);
            // If this is the final step, update status to "completed"
            if ($isFinalStep) {
                if ($status == AcceptanceStatus::PENDING) {
                    if (
                        isset($updatedAcceptance->howReport["whatsapp"]) &&
                        $updatedAcceptance->howReport["whatsapp"] &&
                        ($updatedAcceptance->howReport["whatsappNumber"])
                    ) {
                        $updatedAcceptance->loadMissing("patient", "reportDate");
                        $updatedAcceptance->patient->notify(new WelcomeNotification($acceptance, $acceptance->reportDate->report_date + 1));
                    }
                    if (isset($updatedAcceptance->howReport["sendToReferrer"]) && ($updatedAcceptance->howReport["sendToReferrer"])) {
                        $updatedAcceptance->loadMissing("referrer", "reportDate");
                        $updatedAcceptance->referrer->notify(new WelcomeNotification($updatedAcceptance, $updatedAcceptance->reportDate->report_date + 1));
                    }
                }
                // Redirect to the acceptance details page with success message
                return redirect()
                    ->route('acceptances.show', $updatedAcceptance)
                    ->with(['success' => true, 'status' => 'Acceptance successfully updated and finalized.']);
            }
            if ($updatedAcceptance->status !== AcceptanceStatus::PENDING) {
                return redirect()->route('acceptances.show', $updatedAcceptance->id)
                    ->with('info', 'Progress saved successfully.');
            }

            // For intermediate steps, return to the edit page
            return redirect()->route('acceptances.edit', $updatedAcceptance->id)
                ->with('info', 'Progress saved successfully.');

        } catch (Exception $e) {
            // Handle any exceptions
            return redirect()->back()
                ->withInput()
                ->withErrors('An error occurred: ' . $e->getMessage());
        }
    }

    /**`
     * Remove the specified resource from storage.
     * @throws Exception
     */
    public function destroy(Acceptance $acceptance): RedirectResponse
    {
        $this->authorize("delete", $acceptance);
        $title = $acceptance["name"];
        $this->acceptanceService->deleteAcceptance($acceptance);
        return back()->with(["success" => true, "status" => "$title Successfully Deleted."]);
    }
}
