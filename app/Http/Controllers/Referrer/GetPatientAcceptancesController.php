<?php

namespace App\Http\Controllers\Referrer;

use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\Patient;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GetPatientAcceptancesController extends Controller
{
    public function __invoke(Request $request, Patient $patient): JsonResponse
    {
        $referrerId = $request->query('referrer_id');

        $acceptances = Acceptance::where('patient_id', $patient->id)
            ->where('referrer_id', $referrerId)
            ->whereNot('status', AcceptanceStatus::REPORTED)
            ->with([
                'acceptanceItems' => function ($query) {
                    $query->with(['methodTest.method.test', 'methodTest.method.barcodeGroup']);
                }
            ])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($acceptance) {
                return [
                    'id' => $acceptance->id,
                    'created_at' => $acceptance->created_at->format('Y-m-d H:i'),
                    'status' => $acceptance->status->value,
                    'referenceCode' => $acceptance->referenceCode,
                    'acceptance_items' => $acceptance->acceptanceItems->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'test_name' => $item->methodTest?->method?->test?->name ?? 'Unknown',
                            'method_name' => $item->methodTest?->method?->name ?? 'Unknown',
                            'barcode_group' => $item->methodTest?->method?->barcodeGroup?->name ?? 'Default',
                        ];
                    }),
                ];
            });

        return response()->json(['acceptances' => $acceptances]);
    }
}
