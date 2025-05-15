<?php

namespace App\Http\Controllers\Consultation;

use App\Domains\Consultation\DTOs\ConsultationDTO;
use App\Domains\Consultation\DTOs\CustomerDTO;
use App\Domains\Consultation\DTOs\TimeDTO;
use App\Domains\Consultation\Enums\ConsultationStatus;
use App\Domains\Consultation\Models\Consultation;
use App\Domains\Consultation\Models\Time;
use App\Domains\Consultation\Services\ConsultationService;
use App\Domains\Consultation\Services\CustomerService;
use App\Domains\Consultation\Services\TimeService;
use App\Domains\Reception\DTOs\PatientDTO;
use App\Domains\Reception\Models\Patient;
use App\Domains\Reception\Requests\StorePatientRequest;
use App\Domains\Reception\Services\PatientService;
use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;

class UpdateCustomerToPatientWithConsultationController extends Controller
{
    public function __construct(
        private readonly PatientService $patientService,
        private readonly ConsultationService $consultationService,
        private readonly TimeService $timeService,
        private readonly CustomerService $customerService
    ) {
    }

    /**
     * Convert a customer reservation to a patient consultation.
     *
     * @param Time $time The time slot to update
     * @param StorePatientRequest $request The validated patient data
     * @return RedirectResponse
     */
    public function __invoke(Time $time, StorePatientRequest $request): RedirectResponse
    {
        // Eager load related models
        $time->load('reservable.patient');
        // Validate time slot is for a customer and exists
        if ($time->reservable_type !== 'customer' || !$time->reservable) {
            return back()->withErrors(['message' => 'This time slot is not reserved for a customer']);
        }

        $validated = $request->validated();
        $patient = $this->resolvePatient($time, $validated);

        // Create the consultation
        $consultation = $this->createConsultation($patient, $time);

        // Update the time slot to point to the consultation
        $this->updateTimeSlot($time, $consultation);

        return redirect()
            ->route('acceptances.create', $patient)
            ->with([
                'success' => true,
                'status' => 'Consultation created successfully.',
                'consultation' => $consultation
            ]);
    }

    /**
     * Resolve patient entity from existing data or create a new one.
     *
     * @param Time $time
     * @param array $validated
     * @return Patient The resolved patient
     */
    private function resolvePatient(Time $time, array $validated): Patient
    {
        // Check if patient already exists
        $patient = $time->reservable?->patient;

        if (!$patient) {
            // Try to find existing patient by ID
            if (!empty($validated['id'])) {
                $patient = $this->patientService->getPatientById($validated["id"]);
            }

            // Get the customer from the time slot
            $customer = $this->customerService->findById($time->reservable_id);

            // Create new patient if not found
            if (!$patient) {
                $patient = $this->patientService->createPatient(
                    PatientDTO::fromRequest($validated)
                );
            }

            // Update customer with patient information
            $this->customerService->updateCustomer(
                $customer,
                new CustomerDTO(
                    $patient->name,
                    $patient->phone ?: $customer->phone, // Use null coalescing operator
                    $patient->email,
                    $patient->id
                )
            );
        }

        return $patient;
    }

    /**
     * Create a new consultation for the patient.
     *
     * @param Patient $patient
     * @param Time $time
     * @return mixed The created consultation
     */
    private function createConsultation(Patient $patient, Time $time): mixed
    {
        return $this->consultationService->createConsultation(
            new ConsultationDTO(
                $patient->id,
                $time->consultant_id,
                Carbon::parse($time->started_at, 'Asia/Muscat'),
                ConsultationStatus::WAITING,
                null,
                null,
                $time->id
            )
        );
    }

    /**
     * Update the time slot to reference the consultation.
     *
     * @param Time $time
     * @param Consultation $consultation
     * @return void
     */
    private function updateTimeSlot(Time $time,Consultation $consultation): void
    {
        $this->timeService->updateTime(
            $time,
            new TimeDTO(
                $time->title,
                $time->consultant_id,
                $time->started_at,
                $time->ended_at,
                true,
                'consultation',
                $consultation->id
            )
        );
    }
}
