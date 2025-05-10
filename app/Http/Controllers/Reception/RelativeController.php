<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\DTOs\PatientDTO;
use App\Domains\Reception\DTOs\RelativeDTO;
use App\Domains\Reception\Models\Relative;
use App\Domains\Reception\Requests\RelativeRequest;
use App\Domains\Reception\Services\PatientService;
use App\Domains\Reception\Services\RelativeService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class RelativeController extends Controller
{
    public function __construct(private readonly PatientService $patientService,
                                private readonly RelativeService $relativeService)
    {
    }

    public function store(RelativeRequest $request)
    {
        $validatedData = $request->validated();
        if ($validatedData['patient_id'] == $validatedData['relative_id'])
            return back()->with(["success" => false, "status" => "You can't add yourself as a relative"]);
        $patientDTO = PatientDTO::fromRequest($validatedData);
        $relative = null;
        if (!$patientDTO->id)
            $relative = $this->patientService->createPatient($patientDTO);
        else {
            $relative = $this->patientService->getPatientById($patientDTO->id);
            $relative = $this->patientService->updatePatient($relative, $patientDTO);
        }
        $relativeDto = new RelativeDTO(
            $request->get("patient_id"),
            $relative->id,
            $request->get("relationship"),
        );
        $this->relativeService->makeRelative($relativeDto);
        return back()->with(["success" => true, "status" => "Relative added successfully"]);

    }

    public function update(Relative $relative, Request $request)
    {

        $relativeDto = new RelativeDTO(
            $relative->patient_id,
            $relative->relative_id,
            $request->get("relationship"),
        );
        $this->relativeService->updateRelation($relative, $relativeDto);
        return back()->with(["success" => true, "status" => "Relative updated successfully"]);
    }

    public function destroy(Relative $relative)
    {
        $this->relativeService->deleteRelation($relative);
        return back()->with(["success" => true, "status" => "Relative deleted successfully"]);
    }

}
