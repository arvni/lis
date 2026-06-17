<?php

namespace App\Http\Controllers\Reception;

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

        // The request validates the price/discount leaves; the full nested
        // editor payload (method_test, customParameters, samples…) is read raw
        // and re-shaped by the service via prepareAcceptanceItems().
        $this->acceptanceService->updateAcceptanceItemsFromEditor($acceptance, [
            "tests" => $request->input("tests", []),
            "panels" => $request->input("panels", []),
        ]);

        return back()->with(["success" => true, "status" => "Item updated successfully."]);
    }
}
