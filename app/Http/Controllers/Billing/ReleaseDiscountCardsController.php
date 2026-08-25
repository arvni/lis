<?php

declare(strict_types=1);

namespace App\Http\Controllers\Billing;

use App\Domains\Billing\DTOs\AssignCardsDTO;
use App\Domains\Billing\Exceptions\CardsNotAssignableException;
use App\Domains\Billing\Requests\AssignDiscountCardsRequest;
use App\Domains\Billing\Services\DiscountCardAssignmentService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;

/**
 * Returns cards to stock. Shares the assign request so the same "range or list"
 * rules apply; the partner it carries is only used to locate the cards.
 */
class ReleaseDiscountCardsController extends Controller
{
    public function __construct(private readonly DiscountCardAssignmentService $assignmentService) {}

    public function __invoke(AssignDiscountCardsRequest $request): RedirectResponse
    {
        $dto = AssignCardsDTO::fromArray($request->validated());

        try {
            $released = $this->assignmentService->release($dto, $request->user()?->id);
        } catch (CardsNotAssignableException $exception) {
            return back()->withErrors(['card_ids' => $exception->getMessage()]);
        }

        return back()->with('success', $released.' card(s) returned to stock.');
    }
}
