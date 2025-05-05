<?php

namespace App\Http\Controllers\Consultation;

use App\Domains\Consultation\Services\ConsultationService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ListReservationTimesController extends Controller
{
    protected ConsultationService $consultationService;

    public function __construct(ConsultationService $consultationService)
    {
        $this->consultationService = $consultationService;
    }

    public function __invoke(Request $request): JsonResponse
    {
        $consultantId = $request->get("consultant");
        $date = $request->get("date");

        $timeSlots = $this->consultationService->getAvailableTimeSlots($consultantId, $date);

        return response()->json(["data" => $timeSlots], 200);
    }
}
