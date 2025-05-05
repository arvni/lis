<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Document\Enums\DocumentTag;
use App\Domains\Reception\Events\PatientDocumentUpdateEvent;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Requests\StoreAcceptancePrescriptionRequest;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;

class AcceptancePrescriptionController extends Controller
{
    public function __construct()
    {
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(StoreAcceptancePrescriptionRequest $request, Acceptance $acceptance): RedirectResponse
    {
        PatientDocumentUpdateEvent::dispatch($request->validated()['prescription']['id'], $acceptance->patient_id, DocumentTag::PRESCRIPTION->value, "acceptance", $acceptance->id);
        return back()->with(['success' => true, 'status' => 'Prescription updated successfully']);
    }
}
