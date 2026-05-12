<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Requests\ListAcceptanceItemsRequest;
use App\Domains\Reception\Services\AcceptanceItemService;
use App\Http\Controllers\Controller;
use Inertia\Inertia;

class ListAcceptanceItemsController extends Controller
{
    public function __construct(private readonly AcceptanceItemService $acceptanceItemService)
    {
        $this->middleware("indexProvider");
    }

    public function __invoke(ListAcceptanceItemsRequest $request)
    {
        $requestInputs = $request->all();
         $acceptanceItems=$this->acceptanceItemService->listAcceptanceItems($request->all());
        return  Inertia::render("AcceptanceItem/Index", compact("acceptanceItems", "requestInputs"));
    }
}
