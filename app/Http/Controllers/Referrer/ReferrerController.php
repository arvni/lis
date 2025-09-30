<?php

namespace App\Http\Controllers\Referrer;

use App\Domains\Referrer\DTOs\ReferrerDTO;
use App\Domains\Referrer\Models\Referrer;
use App\Domains\Referrer\Requests\StoreReferrerRequest;
use App\Domains\Referrer\Requests\UpdateReferrerRequest;
use App\Domains\Referrer\Services\ReferrerService;
use App\Http\Controllers\Controller;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ReferrerController extends Controller
{
    public function __construct(private ReferrerService $referrerService)
    {
        $this->middleware("indexProvider")->only("index");
    }

    /**
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize("viewAny", Referrer::class);
        $requestInputs = $request->all();
        $referrers = $this->referrerService->listReferrers($requestInputs);
        return Inertia::render('Referrer/Index', compact("referrers", "requestInputs"));
    }

    /**
     * @throws AuthorizationException
     */
    public function create(Request $request): Response
    {
        $this->authorize("create", Referrer::class);

        return Inertia::render('Referrer/Add', [
            "referrer" => $request->session()->get('referrer'),
            "relative" => $request->session()->get('relative'),
        ]);
    }

    public function store(StoreReferrerRequest $request): RedirectResponse
    {
        $validatedData = $request->validated();
        $referrerDTO = new ReferrerDTO(
            $validatedData['fullName'],
            $validatedData["email"],
            $validatedData['phoneNo'],
            $validatedData['billingInfo'],
            $validatedData['isActive'],
            $validatedData["reportReceivers"]
        );
        $referrer = $this->referrerService->createReferrer($referrerDTO);
        return redirect()->route("referrers.show", $referrer->id);
    }

    /**
     * @throws AuthorizationException
     */
    public function show(Referrer $referrer): Response
    {
        $this->authorize("view", $referrer);
        $data = $this->referrerService->getReferrerDetails($referrer);
        return Inertia::render('Referrer/Show', [
            ...$data,
            "canEdit" => Gate::allows("update", $referrer),
        ]);
    }

    public function edit(Referrer $referrer): Response
    {
        $this->authorize("update", $referrer);
        return Inertia::render('Referrer/Edit', ["referrer" => $referrer]);
    }

    public function update(UpdateReferrerRequest $request, Referrer $referrer): RedirectResponse
    {
        $validatedData = $request->validated();
        $referrerDTO = new ReferrerDTO(
            $validatedData['fullName'],
            $validatedData["email"],
            $validatedData['phoneNo'],
            $validatedData['billingInfo'],
            $validatedData['isActive'],
            $validatedData["reportReceivers"]
        );
        $this->referrerService->updateReferrer($referrer, $referrerDTO);
        return redirect()->route("referrers.show", $referrer->id)
            ->with(['status' => "$referrer->fullName Successfully Updated", "success" => true]);
    }

    /**
     * @throws AuthorizationException
     * @throws Exception
     */
    public function destroy(Referrer $referrer): RedirectResponse
    {
        $this->authorize("delete", $referrer);
        $this->referrerService->deleteReferrer($referrer);
        return redirect()->back()->with(["success" => true, "status" => "$referrer->fullName successfully deleted"]);
    }
}
