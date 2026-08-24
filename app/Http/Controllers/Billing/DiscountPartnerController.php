<?php

declare(strict_types=1);

namespace App\Http\Controllers\Billing;

use App\Domains\Billing\DTOs\DiscountPartnerDTO;
use App\Domains\Billing\Models\DiscountPartner;
use App\Domains\Billing\Requests\StoreDiscountPartnerRequest;
use App\Domains\Billing\Requests\UpdateDiscountPartnerRequest;
use App\Domains\Billing\Resources\DiscountPartnerResource;
use App\Domains\Billing\Services\DiscountPartnerService;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DiscountPartnerController extends Controller
{
    public function __construct(private readonly DiscountPartnerService $partnerService)
    {
        $this->middleware('indexProvider')->only('index');
    }

    /**
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', DiscountPartner::class);
        $requestInputs = $request->all();
        $partners = $this->partnerService->listPartners($requestInputs);

        return Inertia::render('DiscountPartner/Index', [
            'partners' => DiscountPartnerResource::collection($partners),
            'requestInputs' => $requestInputs,
        ]);
    }

    public function store(StoreDiscountPartnerRequest $request): RedirectResponse
    {
        $dto = DiscountPartnerDTO::fromArray($request->validated());
        $this->partnerService->storePartner($dto);

        return back()->with(['success' => true, 'status' => "$dto->name created successfully"]);
    }

    public function update(DiscountPartner $discountPartner, UpdateDiscountPartnerRequest $request): RedirectResponse
    {
        $dto = DiscountPartnerDTO::fromArray($request->validated());
        $this->partnerService->updatePartner($discountPartner, $dto);

        return back()->with(['success' => true, 'status' => "$dto->name updated successfully"]);
    }

    /**
     * @throws AuthorizationException
     */
    public function destroy(DiscountPartner $discountPartner): RedirectResponse
    {
        $this->authorize('delete', $discountPartner);
        $name = $discountPartner->name;
        $this->partnerService->deletePartner($discountPartner);

        return back()->with(['success' => true, 'status' => "$name deleted successfully"]);
    }
}
