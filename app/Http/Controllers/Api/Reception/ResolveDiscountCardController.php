<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Reception;

use App\Domains\Billing\Models\DiscountCard;
use App\Domains\Reception\Services\AcceptanceDiscountCardService;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Tells reception what a scanned card is worth before they commit to it.
 */
class ResolveDiscountCardController extends Controller
{
    public function __construct(private readonly AcceptanceDiscountCardService $cardService) {}

    /**
     * @throws AuthorizationException
     */
    public function __invoke(Request $request): JsonResponse
    {
        $this->authorize('apply', DiscountCard::class);

        $validated = $request->validate([
            'code' => 'required|string|max:255',
            'signature' => 'nullable|string|max:64',
        ]);

        return response()->json($this->cardService->preview(
            $validated['code'],
            $validated['signature'] ?? null
        ));
    }
}
