<?php

namespace App\Http\Controllers\Laboratory;

use App\Domains\Laboratory\DTOs\RequestFormDTO;
use App\Domains\Laboratory\Events\RequestFormUpdated;
use App\Domains\Laboratory\Models\RequestForm;
use App\Domains\Laboratory\Requests\StoreRequestFormRequest;
use App\Domains\Laboratory\Requests\UpdateRequestFormRequest;
use App\Domains\Laboratory\Services\RequestFormService;
use App\Http\Controllers\Controller;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RequestFormController extends Controller
{
    public function __construct(private RequestFormService $requestFormService)
    {
        $this->middleware("indexProvider")->only("index");
    }

    /**
     * Display a listing of the resource.
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize("viewAny", RequestForm::class);
        $requestInputs = $request->all();
        $requestForms = $this->requestFormService->listRequestForms($requestInputs);
        return Inertia::render('RequestForm/Index', compact("requestForms", "requestInputs"));
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreRequestFormRequest $requestFormRequest)
    {
        $validatedData = $requestFormRequest->validated();
        $requestFormDto = new RequestFormDTO(
            $validatedData["name"],
            $validatedData["form_data"],
            $validatedData["document"] ?? null,
        );
        $requestForm = $this->requestFormService->storeRequestForm($requestFormDto);
        RequestFormUpdated::dispatch($requestForm, "create");
        return back()->with(["success" => true, "status" => "$requestFormDto->name Created Successfully"]);
    }


    /**
     * Update the specified resource in storage.
     */
    public function update(RequestForm $requestForm, UpdateRequestFormRequest $request)
    {
        $validatedData = $request->validated();
        $requestFormDto = new RequestFormDTO(
            $validatedData["name"],
            $validatedData["form_data"],
            $validatedData["document"] ?? null,
        );
        $this->requestFormService->updateRequestForm($requestForm, $requestFormDto);
        RequestFormUpdated::dispatch($requestForm, "update");
        return back()->with(["success" => true, "status" => "$requestFormDto->name Updated Successfully"]);
    }

    /**
     * Remove the specified resource from storage.
     * @throws Exception
     */
    public function destroy(RequestForm $requestForm): RedirectResponse
    {
        $this->authorize("delete", $requestForm);
        $title = $requestForm["name"];
        $this->requestFormService->deleteRequestForm($requestForm);
        return back()->with(["success" => true, "status" => "$title Successfully Deleted."]);
    }
}
