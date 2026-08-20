<?php

declare(strict_types=1);

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Exceptions\AcceptanceItemTestNotChangeableException;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Requests\UpdateAcceptanceItemRequest;
use App\Domains\Reception\Services\AcceptanceService;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Throwable;

class UpdateAcceptanceItemController extends Controller
{
    public function __construct(private readonly AcceptanceService $acceptanceService)
    {
    }

    /**
     * @throws AuthorizationException
     * @throws Throwable
     */
    public function __invoke(Acceptance $acceptance, UpdateAcceptanceItemRequest $request): RedirectResponse
    {
        $this->authorize("editItemPrices", $acceptance);

        // The request validates the price/discount leaves and the method test the
        // item points at; the rest of the nested editor payload
        // (customParameters, samples…) is read raw and re-shaped by the service
        // via prepareAcceptanceItems().
        try {
            $this->acceptanceService->updateAcceptanceItemsFromEditor($acceptance, [
                "tests" => $request->input("tests", []),
                "panels" => $request->input("panels", []),
            ]);
        } catch (AcceptanceItemTestNotChangeableException $e) {
            // The editor hides the test picker for an item that is already under
            // way, but a stale page can still get here — answer with an error the
            // dialog can surface instead of a 500.
            return back()->withErrors(["message" => $e->getMessage()]);
        }

        return back()->with(["success" => true, "status" => "Item updated successfully."]);
    }
}
