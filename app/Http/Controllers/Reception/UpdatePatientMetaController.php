<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\DTOs\PatientMetaDTO;
use App\Domains\Reception\Models\Patient;
use App\Domains\Reception\Requests\UpdatePatientMetaRequest;
use App\Domains\Reception\Services\PatientMetaService;
use App\Http\Controllers\Controller;

class UpdatePatientMetaController extends Controller
{
    public function __construct(private PatientMetaService $patientMetaService)
    {
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Patient $patient, UpdatePatientMetaRequest $request)
    {
        $validated = $request->validated();
        $patientMetaDto = new PatientMetaDTO(
            maritalStatus: $validated['maritalStatus']??null,
            company: $validated['company']??null,
            profession: $validated['profession']??null,
            email: $validated['email']??null,
            address: $validated['address']??null,
            details: $validated['details']??null,
        );
        $this->patientMetaService->updatePatient($patient, $patientMetaDto);
        return back()->with(['success' => true, 'status' => 'Patient meta updated successfully',]);
    }
}
