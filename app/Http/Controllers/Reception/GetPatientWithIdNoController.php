<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Resources\PatientResource;
use App\Domains\Reception\Services\PatientService;
use App\Http\Controllers\Controller;

class GetPatientWithIdNoController extends Controller
{
    public function __construct(private PatientService $patientService)
    {
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke($idNo)
    {
        $patient = $this->patientService->getPatientByIdNo($idNo);
        if (!$patient) {
            return response()->json(["message" => "Patient not found"], 404);
        }
        return new PatientResource($patient);
    }
}
