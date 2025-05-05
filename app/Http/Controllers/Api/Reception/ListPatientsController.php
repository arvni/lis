<?php

namespace App\Http\Controllers\Api\Reception;

use App\Domains\Reception\Services\PatientService;
use App\Http\Controllers\Controller;
use App\Http\Resources\ListResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ListPatientsController extends Controller
{
    public function __construct(private PatientService $patientService)
    {
        $this->middleware("indexProvider:name");
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): AnonymousResourceCollection
    {
        $queryData = $request->all();
        $patients = $this->patientService->listPatients($queryData);
        return ListResource::collection($patients);
    }
}
