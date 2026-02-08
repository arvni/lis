<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ToggleSamplelessAcceptanceItemController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request, Acceptance $acceptance, AcceptanceItem $acceptanceItem)
    {
        Gate::authorize('Reception.Acceptances.Toggle Sampleless Acceptance Item');

        $acceptanceItem->update([
            'sampleless' => !$acceptanceItem->sampleless
        ]);

        return redirect()->back()->with('success', 'Sampleless status updated successfully.');
    }
}
