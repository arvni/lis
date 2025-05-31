<?php

namespace App\Http\Controllers\Referrer;

use App\Domains\Document\Enums\DocumentTag;
use App\Domains\Reception\DTOs\PatientDTO;
use App\Domains\Reception\Events\PatientDocumentUpdateEvent;
use App\Domains\Reception\Requests\StorePatientRequest;
use App\Domains\Reception\Services\PatientService;
use App\Domains\Referrer\DTOs\ReferrerOrderDTO;
use App\Domains\Referrer\Models\ReferrerOrder;
use App\Domains\Referrer\Services\ReferrerOrderService;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;

class StoreReferrerOrderPatientController extends Controller
{
    public function __construct(private readonly ReferrerOrderService $referrerOrderService, private PatientService $patientService)
    {
    }

    /**
     * Handle the incoming request.
     * @param ReferrerOrder $referrerOrder
     * @param StorePatientRequest $request
     * @return RedirectResponse|void
     * @throws AuthorizationException
     */
    public function __invoke(ReferrerOrder $referrerOrder, StorePatientRequest $request)
    {
        $this->authorize("createPatient", $referrerOrder);
        if ($referrerOrder->patient_id)
            return back();
        $patient = null;
        $patientId = $request->input("id") ?? $request->input("patient.id");
        if ($patientId)
            $patient = $this->patientService->getPatientById($patientId);
        else {
            $patientDto = PatientDto::fromRequest($request->validated());
            $patient = $this->patientService->createPatient($patientDto);
        }
        $referrerOrderDto = ReferrerOrderDto::fromArray($referrerOrder->toArray());
        $referrerOrderDto->patientId = $patient->id;

        $this->referrerOrderService->updateReferrerOrder($referrerOrder, $referrerOrderDto);
        if ($referrerOrder->ownedDocuments()->count()) {
            $referrerOrder->load("ownedDocuments");
            foreach ($referrerOrder->ownedDocuments as $document) {
                PatientDocumentUpdateEvent::dispatch($document->id, $patient->id, DocumentTag::DOCUMENT, "referrerOrder", $referrerOrder->id);
            }
        }

        return back()->with([
            "success" => true,
            "status" => "Patient Added Successfully"
        ]);

    }
}
