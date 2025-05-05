<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Laboratory\Models\Section;
use App\Domains\Reception\Requests\EnterSectionSampleRequest;
use App\Domains\Reception\Services\SampleEntryService;
use App\Http\Controllers\Controller;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;

class EnterSectionSampleController extends Controller
{
    public function __construct(private readonly SampleEntryService $sampleEntryService)
    {

    }

    /**
     * Handle the incoming request.
     * @throws AuthorizationException
     */
    public function __invoke(Section $section, EnterSectionSampleRequest $request): RedirectResponse
    {
        $this->authorize("action", [$section, "Enter"]);
        $this->authorize("action", [$section, "Enter"]);

        $barcode = $request->get("barcode");
        $userId = auth()->id();
        $userName = auth()->user()->name;

        try {
            $this->sampleEntryService->processSampleEntry($barcode, $section, $userId, $userName);
            return redirect()->back()->with([
                "success" => true,
                "status" => "Sample accepted successfully."
            ]);
        } catch (Exception $e) {
            return back()->withErrors(["barcode" => $e->getMessage()]);
        }
    }
}
