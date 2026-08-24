<?php

declare(strict_types=1);

namespace App\Http\Controllers\Billing;

use App\Domains\Billing\Models\DiscountCard;
use App\Domains\Billing\Services\DiscountCardService;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;

class RevokeDiscountCardController extends Controller
{
    public function __construct(private readonly DiscountCardService $cardService) {}

    /**
     * Killing a single leaked card without touching the rest of its batch.
     *
     * @throws AuthorizationException
     */
    public function __invoke(DiscountCard $discountCard): RedirectResponse
    {
        $this->authorize('revoke', $discountCard);
        $this->cardService->revoke($discountCard);

        return back()->with([
            'success' => true,
            'status' => "Card $discountCard->number revoked",
        ]);
    }
}
