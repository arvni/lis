<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Models\Patient;
use App\Domains\Reception\Requests\MergePatientsRequest;
use App\Domains\Reception\Services\PatientMergeService;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MergePatientController extends Controller
{
    /**
     * Profile fields the user can pick a winning value for, field by field.
     */
    private const COMPARABLE_FIELDS = [
        "avatar",
        "firstName",
        "secondName",
        "thirdName",
        "lastName",
        "fullName",
        "idNo",
        "nationality",
        "dateOfBirth",
        "gender",
        "phone",
        "tribe",
        "wilayat",
        "governorate",
        "village",
    ];

    /**
     * patient_meta fields the user can pick a winning value for, field by field.
     * (avatar is intentionally excluded — it is an image path carried over with
     * the baseline meta transfer rather than chosen as text.)
     */
    private const COMPARABLE_META_FIELDS = [
        "maritalStatus",
        "company",
        "profession",
        "address",
        "email",
        "details",
    ];

    public function __construct(private readonly PatientMergeService $patientMergeService)
    {
    }

    /**
     * @throws AuthorizationException
     */
    public function create(): Response
    {
        $this->authorize("merge", Patient::class);

        return Inertia::render('Patient/Merge', [
            "fields" => self::COMPARABLE_FIELDS,
            "metaFields" => self::COMPARABLE_META_FIELDS,
        ]);
    }

    /**
     * Side-by-side data for two patients so the UI can build the field chooser
     * and show what will be transferred.
     *
     * @throws AuthorizationException
     */
    public function compare(Request $request): JsonResponse
    {
        $this->authorize("merge", Patient::class);

        $validated = $request->validate([
            "first_id" => ["required", "integer", "exists:patients,id"],
            "second_id" => ["required", "integer", "different:first_id", "exists:patients,id"],
        ]);

        return response()->json([
            "first" => $this->presentPatient(Patient::findOrFail($validated["first_id"])),
            "second" => $this->presentPatient(Patient::findOrFail($validated["second_id"])),
        ]);
    }

    /**
     * @throws AuthorizationException
     */
    public function merge(MergePatientsRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $keep = Patient::findOrFail($validated["keep_id"]);
        $remove = Patient::findOrFail($validated["remove_id"]);
        $attributes = $validated["attributes"] ?? [];
        $metaAttributes = $validated["meta"] ?? [];

        $merged = $this->patientMergeService->merge($keep, $remove, $attributes, $metaAttributes);

        return redirect()->route("patients.show", $merged->id)
            ->with(["success" => true, "status" => "Patients successfully merged into {$merged->fullName}"]);
    }

    private function presentPatient(Patient $patient): array
    {
        $fields = [];
        foreach (self::COMPARABLE_FIELDS as $field) {
            $fields[$field] = $patient->getAttribute($field);
        }
        // Normalise the date cast (Carbon) to a plain Y-m-d string so the value
        // round-tripped through the form is a valid DATE on save, not an ISO string.
        $dob = $patient->getAttribute("dateOfBirth");
        $fields["dateOfBirth"] = $dob instanceof \DateTimeInterface ? $dob->format("Y-m-d") : $dob;

        $meta = $patient->patientMeta()->first();
        $metaFields = [];
        foreach (self::COMPARABLE_META_FIELDS as $field) {
            $metaFields[$field] = $meta?->getAttribute($field);
        }

        return [
            "id" => $patient->id,
            "fullName" => $patient->fullName,
            "fields" => $fields,
            "meta" => $metaFields,
            "relations" => [
                "acceptances" => $patient->acceptances()->count(),
                "consultations" => $patient->consultations()->count(),
                "samples" => $patient->samples()->count(),
                "invoices" => $patient->invoices()->count(),
                "payments" => $patient->payments()->count(),
                "documents" => $patient->ownedDocuments()->count(),
                "relatives" => $patient->relatives()->count() + $patient->patients()->count(),
            ],
        ];
    }
}
