<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Services\AcceptanceItemConversionService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PromoteToPanelController extends Controller
{
    public function __construct(private AcceptanceItemConversionService $conversionService)
    {
    }

    public function __invoke(Request $request, Acceptance $acceptance): RedirectResponse
    {
        // Rewrites the acceptance's items — gate on editing the acceptance.
        $this->authorize("update", $acceptance);

        $request->validate([
            'acceptance_item_ids'   => ['required', 'array', 'min:1'],
            'acceptance_item_ids.*' => ['required', 'integer', 'exists:acceptance_items,id'],
            'panel_method_tests'    => ['required', 'array', 'min:2'],
            'panel_method_tests.*'  => ['required', 'integer', 'exists:method_tests,id'],
        ]);

        $this->conversionService->promoteToPanel(
            $request->input('acceptance_item_ids'),
            $request->input('panel_method_tests')
        );

        return back();
    }
}
