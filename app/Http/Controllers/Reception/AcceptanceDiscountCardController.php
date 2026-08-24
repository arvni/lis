<?php

declare(strict_types=1);

namespace App\Http\Controllers\Reception;

use App\Domains\Billing\Models\DiscountCard;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Requests\AttachDiscountCardRequest;
use App\Domains\Reception\Services\AcceptanceDiscountCardService;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;

class AcceptanceDiscountCardController extends Controller
{
    public function __construct(private readonly AcceptanceDiscountCardService $cardService) {}

    /**
     * Attach a scanned card. A card that cannot be used comes back as a validation
     * error on the field, so nothing about the acceptance changes.
     */
    public function store(Acceptance $acceptance, AttachDiscountCardRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $verdict = $this->cardService->attach(
            $acceptance,
            $validated['code'],
            $validated['signature'] ?? null
        );

        if (! $verdict['valid']) {
            return back()->withErrors(['code' => $verdict['reason'] ?? 'This card cannot be used.']);
        }

        return back()->with([
            'success' => true,
            'status' => "Card {$verdict['card']['number']} applied",
        ]);
    }

    /**
     * @throws AuthorizationException
     */
    public function destroy(Acceptance $acceptance): RedirectResponse
    {
        $this->authorize('update', $acceptance);
        $this->authorize('apply', DiscountCard::class);

        $this->cardService->detach($acceptance);

        return back()->with(['success' => true, 'status' => 'Discount card removed']);
    }
}
