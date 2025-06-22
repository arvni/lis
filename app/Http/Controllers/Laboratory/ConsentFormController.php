<?php

namespace App\Http\Controllers\Laboratory;

use App\Domains\Laboratory\DTOs\ConsentFormDTO;
use App\Domains\Laboratory\Events\ConsentFormUpdated;
use App\Domains\Laboratory\Models\ConsentForm;
use App\Domains\Laboratory\Requests\StoreConsentFormRequest;
use App\Domains\Laboratory\Requests\UpdateConsentFormRequest;
use App\Domains\Laboratory\Services\ConsentFormService;
use App\Http\Controllers\Controller;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ConsentFormController extends Controller
{
    public function __construct(private ConsentFormService $consentFormService)
    {
        $this->middleware("indexProvider")->only("index");
    }

    /**
     * Display a listing of the resource.
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize("viewAny", ConsentForm::class);
        $requestInputs = $request->all();
        $consentForms = $this->consentFormService->listConsentForms($requestInputs);
        return Inertia::render('ConsentForm/Index', compact("consentForms", "requestInputs"));
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreConsentFormRequest $consentFormRequest)
    {
        $validatedData = $consentFormRequest->validated();
        $consentFormDto = new ConsentFormDTO(
            $validatedData["name"],
            $validatedData["document"] ?? null,
        );
        $consentForm = $this->consentFormService->storeConsentForm($consentFormDto);
        ConsentFormUpdated::dispatch($consentForm, "create");
        return back()->with(["success" => true, "status" => "$consentFormDto->name Created Successfully"]);
    }


    /**
     * Update the specified resource in storage.
     */
    public function update(ConsentForm $consentForm, UpdateConsentFormRequest $request)
    {
        $validatedData = $request->validated();
        $consentFormDto = new ConsentFormDTO(
            $validatedData["name"],
            $validatedData["document"] ?? null,
        );
        $this->consentFormService->updateConsentForm($consentForm, $consentFormDto);
        ConsentFormUpdated::dispatch($consentForm, "update");
        return back()->with(["success" => true, "status" => "$consentFormDto->name Updated Successfully"]);
    }

    /**
     * Remove the specified resource from storage.
     * @throws Exception
     */
    public function destroy(ConsentForm $consentForm): RedirectResponse
    {
        $this->authorize("delete", $consentForm);
        $title = $consentForm["name"];
        $this->consentFormService->deleteConsentForm($consentForm);
        return back()->with(["success" => true, "status" => "$title Successfully Deleted."]);
    }
}
