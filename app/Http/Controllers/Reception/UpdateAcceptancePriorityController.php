<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Enums\AcceptancePriority;
use App\Domains\Reception\Models\Acceptance;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rules\Enum;

class UpdateAcceptancePriorityController extends Controller
{
    public function __invoke(Request $request, Acceptance $acceptance)
    {
        Gate::authorize('Reception.Acceptances.Update Priority');

        $request->validate([
            'priority' => ['required', new Enum(AcceptancePriority::class)],
        ]);

        $acceptance->update(['priority' => $request->priority]);

        return redirect()->back()->with('success', 'Priority updated.');
    }
}
