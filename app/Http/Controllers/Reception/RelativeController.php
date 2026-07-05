<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Adapters\ReferrerAdapter;
use App\Domains\Reception\DTOs\PatientDTO;
use App\Domains\Reception\DTOs\RelativeDTO;
use App\Domains\Reception\Models\Patient;
use App\Domains\Reception\Models\Relative;
use App\Domains\Reception\Requests\RelativeRequest;
use App\Domains\Reception\Requests\UpdateRelativeRequest;
use App\Domains\Reception\Services\PatientService;
use App\Domains\Reception\Services\RelativeService;
use App\Http\Controllers\Controller;

class RelativeController extends Controller
{
    public function __construct(private readonly PatientService   $patientService,
                                private readonly RelativeService  $relativeService,
                                private readonly ReferrerAdapter  $referrerAdapter)
    {
    }

    public function store(RelativeRequest $request): \Illuminate\Http\RedirectResponse
    {
        $validatedData = $request->validated();
        if ($validatedData['patient_id'] == ($validatedData['relative_id'] ?? null))
            return back()->with(["success" => false, "status" => "You can't add yourself as a relative"]);
        $relative = $this->patientService->getPatientByIdNo($validatedData["idNo"]);

        $patientDTO = PatientDTO::fromRequest($validatedData);
        if (!$relative) {
            if (!$patientDTO->id)
                $relative = $this->patientService->createPatient($patientDTO);
            else {
                $relative = $this->patientService->getPatientById($patientDTO->id);
                $relative = $this->patientService->updatePatient($relative, $patientDTO);
            }
        }
        $relativeDto = new RelativeDTO(
            $request->get("patient_id"),
            $relative->id,
            $request->get("relationship"),
        );
        $this->relativeService->makeRelative($relativeDto);

        // If this is from a referrer order, link the patient back into the order payload.
        if ($request->has('referrer_order_id')) {
            $this->referrerAdapter->attachPatientToOrder(
                (int)$request->get('referrer_order_id'),
                $relative,
                $validatedData['reference_id'] ?? null,
                $validatedData['idNo'] ?? null,
            );
        }

        return back()->with(["success" => true, "status" => "Relative added successfully"]);

    }

    public function update(Relative $relative, UpdateRelativeRequest $request): \Illuminate\Http\RedirectResponse
    {
        $relativeDto = new RelativeDTO(
            $relative->patient_id,
            $relative->relative_id,
            $request->get("relationship"),
        );
        $this->relativeService->updateRelation($relative, $relativeDto);
        return back()->with(["success" => true, "status" => "Relative updated successfully"]);
    }

    public function destroy(Relative $relative): \Illuminate\Http\RedirectResponse
    {
        // Relatives are patient records — mirror store/update gating.
        $this->authorize("create", Patient::class);
        $this->relativeService->deleteRelation($relative);
        return back()->with(["success" => true, "status" => "Relative deleted successfully"]);
    }

}
