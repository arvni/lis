<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Services\AcceptanceService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class CreateAcceptanceInvoiceController extends Controller
{
    public function __construct(private AcceptanceService $acceptanceService)
    {
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request,Acceptance $acceptance)
    {

    }
}
