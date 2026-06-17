<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Requests\UpdateAcceptanceItemPricesRequest;
use App\Domains\Reception\Services\AcceptanceItemService;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;

class UpdateAcceptanceItemPricesController extends Controller
{
    public function __construct(private readonly AcceptanceItemService $acceptanceItemService)
    {
    }

    /**
     * @throws AuthorizationException
     */
    public function __invoke(Acceptance $acceptance, UpdateAcceptanceItemPricesRequest $request): RedirectResponse
    {
        $this->authorize("editItemPrices", $acceptance);

        $this->acceptanceItemService->updateItemPrices($acceptance, $request->validated("items"));

        return back()->with(["success" => true, "status" => "Item prices updated successfully."]);
    }
}
