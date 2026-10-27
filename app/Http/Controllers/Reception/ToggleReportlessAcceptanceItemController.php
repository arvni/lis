<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Exceptions\AcceptanceItemInProgressException;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Services\AcceptanceItemService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ToggleReportlessAcceptanceItemController extends Controller
{
    public function __construct(private readonly AcceptanceItemService $acceptanceItemService) {}

    public function __invoke(Request $request, Acceptance $acceptance, AcceptanceItem $acceptanceItem): \Illuminate\Http\RedirectResponse
    {
        Gate::authorize('Reception.Acceptances.Toggle Reportless Acceptance Item');
        abort_unless((int) $acceptanceItem->acceptance_id === (int) $acceptance->id, 404);

        try {
            $this->acceptanceItemService->toggleReportless($acceptanceItem, (string) $request->user()?->name);
        } catch (AcceptanceItemInProgressException $e) {
            return back()->withErrors(['message' => $e->getMessage()]);
        }

        return redirect()->back()->with('success', 'Reportless status updated successfully.');
    }
}
