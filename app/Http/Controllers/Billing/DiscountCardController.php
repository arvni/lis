<?php

declare(strict_types=1);

namespace App\Http\Controllers\Billing;

use App\Domains\Billing\Enums\DiscountCardStatus;
use App\Domains\Billing\Models\DiscountCard;
use App\Domains\Billing\Requests\UpdateDiscountCardRequest;
use App\Domains\Billing\Resources\DiscountCardResource;
use App\Domains\Billing\Services\DiscountCardService;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DiscountCardController extends Controller
{
    public function __construct(private readonly DiscountCardService $cardService)
    {
        $this->middleware('indexProvider')->only('index');
    }

    /**
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', DiscountCard::class);
        $requestInputs = $request->all();
        $cards = $this->cardService->listCards($requestInputs);

        return Inertia::render('DiscountCard/Index', [
            'cards' => DiscountCardResource::collection($cards),
            'requestInputs' => $requestInputs,
            'statuses' => array_map(
                static fn (DiscountCardStatus $status): string => $status->value,
                DiscountCardStatus::assignable()
            ),
            'canIssue' => $request->user()?->can('issue', DiscountCard::class) ?? false,
            'canAssign' => $request->user()?->can('assign', DiscountCard::class) ?? false,
        ]);
    }

    public function update(DiscountCard $discountCard, UpdateDiscountCardRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $status = DiscountCardStatus::from($validated['status']);

        $this->cardService->updateCard($discountCard, [
            'expires_at' => $validated['expires_at'] ?? null,
            'usage_limit' => $validated['usage_limit'] ?? null,
        ]);
        $this->cardService->changeStatus($discountCard, $status);

        return back()->with([
            'success' => true,
            'status' => "Card $discountCard->number updated successfully",
        ]);
    }
}
