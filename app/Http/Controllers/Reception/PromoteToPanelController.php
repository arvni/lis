<?php

declare(strict_types=1);

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Requests\PromoteToPanelRequest;
use App\Domains\Reception\Services\AcceptanceItemConversionService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;

class PromoteToPanelController extends Controller
{
    public function __construct(private AcceptanceItemConversionService $conversionService) {}

    public function __invoke(PromoteToPanelRequest $request, Acceptance $acceptance): RedirectResponse
    {
        $validated = $request->validated();

        $this->conversionService->promoteToPanel(
            (array) $validated['acceptance_item_ids'],
            (array) $validated['panel_method_tests']
        );

        return back();
    }
}
