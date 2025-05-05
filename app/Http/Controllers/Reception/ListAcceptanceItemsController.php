<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Services\AcceptanceItemService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ListAcceptanceItemsController extends Controller
{
    public function __construct(private readonly AcceptanceItemService $acceptanceItemService)
    {
        $this->middleware("indexProvider");
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        $requestInputs = $request->all();
         $acceptanceItems=$this->acceptanceItemService->listAcceptanceItems($request->all());
        return  Inertia::render("AcceptanceItem/Index", compact("acceptanceItems", "requestInputs"));
    }
}
