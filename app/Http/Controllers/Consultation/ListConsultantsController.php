<?php

namespace App\Http\Controllers\Consultation;

use App\Domains\Consultation\Services\ConsultantService;
use App\Http\Controllers\Controller;
use App\Http\Resources\ListResource;
use Illuminate\Http\Request;

class ListConsultantsController extends Controller
{
    public function __construct(private readonly ConsultantService $consultantService)
    {
        $this->middleware("indexProvider");
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        $requestInputs = $request->all();
        $consultants = $this->consultantService->listConsultants([...$requestInputs, "filters" => [...($requestInputs["filters"] ?? []), "active" => true]]);
        return ListResource::collection($consultants);
    }
}
