<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Services\AcceptanceItemConversionService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;

class EjectPanelController extends Controller
{
    public function __construct(private AcceptanceItemConversionService $conversionService)
    {
    }

    public function __invoke(Acceptance $acceptance, AcceptanceItem $acceptanceItem): RedirectResponse
    {
        if (!$acceptanceItem->panel_id) {
            return back()->withErrors(['message' => 'This acceptance item is not part of a panel.']);
        }

        $this->conversionService->ejectPanel($acceptanceItem);

        return back();
    }
}
