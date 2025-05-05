<?php

namespace App\Http\Controllers\Consultation;

use App\Domains\Consultation\Models\Consultation;
use App\Domains\Consultation\Services\ConsultationService;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;

class StartConsultationController extends Controller
{
    public function __construct(private readonly ConsultationService $consultationService)
    {
    }

    /**
     * Handle the incoming request.
     * @throws AuthorizationException
     */
    public function __invoke(Consultation $consultation): RedirectResponse
    {
        $this->authorize("done", $consultation);
        $this->consultationService->startConsultation($consultation);
        return redirect()->route("consultations.show", $consultation);
    }
}
