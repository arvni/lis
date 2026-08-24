<?php

declare(strict_types=1);

namespace App\Http\Controllers\Billing;

use App\Domains\Billing\Services\DiscountCardResolver;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The page a card's QR points at. Public and unauthenticated by design — a bearer
 * card carries no patient identity, so there is nothing here to protect beyond
 * not confirming what a partner's contract contains to a stranger holding a dead card.
 */
class VerifyDiscountCardController extends Controller
{
    public function __construct(private readonly DiscountCardResolver $resolver) {}

    public function __invoke(string $uuid, Request $request): Response
    {
        $validity = $this->resolver->resolve($uuid, $request->string('s')->toString() ?: null);
        $card = $validity->card;

        return Inertia::render('DiscountCard/Verify', [
            'valid' => $validity->valid,
            'reason' => $validity->reason,
            // Only a card that actually works reveals whose contract it belongs to.
            'card' => $validity->valid && $card ? [
                'number' => $card->number,
                'expires_at' => $card->expires_at?->format('Y-m-d'),
                'partner' => $card->partner?->name,
                'discounts' => $card->partner?->offers
                    ->map(fn ($offer) => [
                        'title' => $offer->title,
                        'type' => $offer->type->name,
                        'amount' => $offer->amount,
                    ])->values(),
            ] : null,
        ]);
    }
}
