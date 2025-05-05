<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Services\AcceptanceService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class CancelAcceptanceController extends Controller
{
    public function __construct(private AcceptanceService $acceptanceService)
    {
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Acceptance $acceptance)
    {
        $this->acceptanceService->cancelAcceptance($acceptance);
        return redirect()->back()->with(["success"=>true,"message"=>"Acceptance Cancelled Successfully"]);
    }
}
