<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\DTOs\PatientDTO;
use App\Domains\Reception\DTOs\RelativeDTO;
use App\Domains\Reception\Models\Relative;
use App\Domains\Reception\Requests\RelativeRequest;
use App\Domains\Reception\Services\PatientService;
use App\Domains\Reception\Services\RelativeService;
use App\Domains\Referrer\Models\ReferrerOrder;
use App\Events\ReferrerOrderPatientCreated;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class RelativeController extends Controller
{
    public function __construct(private readonly PatientService  $patientService,
                                private readonly RelativeService $relativeService)
    {
    }

    public function store(RelativeRequest $request)
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

        // If this is from a referrer order, update orderInformation and fire event
        if ($request->has('referrer_order_id')) {
            $referrerOrder = ReferrerOrder::find($request->get('referrer_order_id'));

            if ($referrerOrder) {
                // Update orderInformation JSON to add server_id to the patient
                $orderInformation = $referrerOrder->orderInformation;

                // Find and update the patient in patients array
                if (isset($orderInformation['patients'])) {
                    foreach ($orderInformation['patients'] as &$patient) {
                        // Match by reference_id or id_no
                        if (($patient['reference_id'] ?? null) === ($validatedData['reference_id']??0) ||
                            ($patient['id_no'] ?? null) === $validatedData['idNo']) {
                            $patient['server_id'] = $relative->id;
                            break;
                        }
                    }
                    unset($patient); // Break reference
                }

                // Also update in orderItems patients if exists
                if (isset($orderInformation['orderItems'])) {
                    foreach ($orderInformation['orderItems'] as &$orderItem) {
                        if (isset($orderItem['patients'])) {
                            foreach ($orderItem['patients'] as &$patient) {
                                if (($patient['reference_id'] ?? null) === ($validatedData['reference_id']??0) ||
                                    ($patient['id_no'] ?? null) === $validatedData['idNo']) {
                                    $patient['server_id'] = $relative->id;
                                }
                            }
                            unset($patient);
                        }
                    }
                    unset($orderItem);
                }

                // Save updated orderInformation
                $referrerOrder->orderInformation = $orderInformation;
                $referrerOrder->save();

                // Fire event for webhook
                event(new ReferrerOrderPatientCreated($referrerOrder, $relative, false));
            }
        }

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
