<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Services\AcceptanceService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class PublishAcceptanceController extends Controller
{
    public function __construct(private readonly AcceptanceService $acceptanceService)
    {
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Acceptance $acceptance, Request $request)
    {
        // Validate that all acceptance items have approved reports
        $acceptance->load([
            'acceptanceItems' => function ($q) {
                $q->where('reportless', false)
                    ->with('report');
            }
        ]);

        // Check if all non-reportless items have reports
        foreach ($acceptance->acceptanceItems as $item) {
            if (!$item->report) {
                return back()->withErrors("Acceptance item #{$item->id} does not have a report");
            }
            if (!$item->report->status) {
                return back()->withErrors("Report for acceptance item #{$item->id} has been rejected");
            }
            if (!$item->report->approver_id) {
                return back()->withErrors("Report for acceptance item #{$item->id} needs to be approved first");
            }
        }

        $user = auth()->user();
        $silentlyPublish = $request->input("silently_publish", false);

        $this->acceptanceService->publishAcceptance($acceptance, $user->id, $silentlyPublish);

        return redirect()->back()->with([
            "success" => true,
            "status" => "All reports for acceptance #{$acceptance->id} have been successfully published"
        ]);
    }
}
