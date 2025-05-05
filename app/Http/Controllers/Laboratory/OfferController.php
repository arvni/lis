<?php

namespace App\Http\Controllers\Laboratory;

use App\Domains\Laboratory\DTOs\OfferDTO;
use App\Domains\Laboratory\Models\Offer;
use App\Domains\Laboratory\Requests\StoreOfferRequest;
use App\Domains\Laboratory\Requests\UpdateOfferRequest;
use App\Domains\Laboratory\Services\OfferService;
use App\Http\Controllers\Controller;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OfferController extends Controller
{
    public function __construct(private readonly OfferService $offerService)
    {
        $this->middleware("indexProvider")->only("index");
    }

    /**
     * Display a listing of the resource.
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize("viewAny", Offer::class);
        $requestInputs = $request->all();
        $offers = $this->offerService->listOffers($requestInputs);
        return Inertia::render('Offer/Index', compact("offers", "requestInputs"));
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreOfferRequest $offerRequest)
    {
        $validatedData = $offerRequest->validated();
        $offerDto = OfferDTO::fromArray($validatedData);
        $this->offerService->storeOffer($offerDto);
        return back()->with(["success" => true, "status" => "$offerDto->title Created Successfully"]);
    }


    /**
     * Update the specified resource in storage.
     */
    public function update(Offer $offer, UpdateOfferRequest $request)
    {
        $validatedData = $request->validated();
        $offerDto = OfferDTO::fromArray($validatedData);
        $this->offerService->updateOffer($offer, $offerDto);
        return back()->with(["success" => true, "status" => "$offerDto->title Updated Successfully"]);
    }

    /**
     * Remove the specified resource from storage.
     * @throws Exception
     */
    public function destroy(Offer $offer): RedirectResponse
    {
        $this->authorize("delete", $offer);
        $title = $offer["name"];
        $this->offerService->deleteOffer($offer);
        return back()->with(["success" => true, "status" => "$title Successfully Deleted."]);
    }
}
