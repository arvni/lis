<?php

namespace App\Http\Controllers\Referrer;

use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\Patient;
use App\Domains\Referrer\Adapters\ReceptionAdapter;
use App\Domains\Referrer\Resources\PatientAcceptanceResource;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GetPatientAcceptancesController extends Controller
{
    public function __construct(private readonly ReceptionAdapter $receptionAdapter) {}

    public function __invoke(Request $request, Patient $patient): JsonResponse
    {
        // PHI — patient's acceptances; gate on acceptance listing.
        $this->authorize("viewAny", Acceptance::class);

        $referrerId = $request->query('referrer_id');
        $poolingOnly = filter_var($request->query('pooling_only'), FILTER_VALIDATE_BOOLEAN);

        $acceptances = $this->receptionAdapter->getPatientAcceptances(
            $patient,
            $referrerId !== null ? (int) $referrerId : null,
            $poolingOnly,
        );

        return response()->json([
            'acceptances' => PatientAcceptanceResource::collection($acceptances),
        ]);
    }
}
