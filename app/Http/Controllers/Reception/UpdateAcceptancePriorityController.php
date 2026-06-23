<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Requests\UpdateAcceptancePriorityRequest;
use App\Http\Controllers\Controller;

class UpdateAcceptancePriorityController extends Controller
{
    public function __invoke(UpdateAcceptancePriorityRequest $request, Acceptance $acceptance): \Illuminate\Http\RedirectResponse
    {
        $acceptance->update(['priority' => $request->priority]);

        return redirect()->back()->with('success', 'Priority updated.');
    }
}
