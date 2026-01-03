<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ToggleReportlessAcceptanceItemController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request, Acceptance $acceptance, AcceptanceItem $acceptanceItem)
    {
        Gate::authorize('Reception.Acceptances.Toggle Reportless Acceptance Item');

        $acceptanceItem->update([
            'reportless' => !$acceptanceItem->reportless
        ]);

        return redirect()->back()->with('success', 'Reportless status updated successfully.');
    }
}
