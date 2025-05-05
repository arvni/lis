<?php

namespace App\Domains\Reception\DTOs;

use App\Domains\Reception\Enums\AcceptanceStatus;

class AcceptanceDTO
{
    public function __construct(
        public ?int              $patientId,
        public ?int              $step,
        public ?int              $consultationId,
        public ?int              $doctorId,
        public ?int              $invoiceId,
        public ?int              $referrerId,
        public ?int              $acceptorId,
        public ?string           $referenceCode,
        public ?string           $samplerGender,
        public array|string|null $howReport = null,
        public array|string|null $doctor = null,
        public ?array            $acceptanceItems,
        public ?AcceptanceStatus $status,
        public bool              $outPatient = false,

    )
    {
    }

    public static function createFromRequestData(array $data): AcceptanceDTO
    {
        // Extract patient ID
        $patientId = $data['patient']['id'] ?? $data["patient_id"] ?? null;

        // Extract step
        $step = $data['step'] ?? null;

        // Extract consultation ID
        $consultationId =$data["consultation"]["id"]?? $data['consultation_id'] ??null;

        // Doctor ID will be handled in processing methods
        $doctorId =$data["doctor"]["id"]?? $data["doctor_id"]?? null;

        // These may not be in the request data but required by DTO
        $invoiceId = $data["invoice_id"] ?? null;
        $acceptorId = $data["acceptor_id"] ?? auth()->user()->id;

        // Extract referrer information
        $referrerId = $data['referrer']['id'] ?? $data["referrer_id"] ?? null;
        $referenceCode = $data['referenceCode'] ?? null;

        // Extract sampling information
        $samplerGender = $data['samplerGender'] ?? null;

        // Extract reporting method
        $howReport = isset($data['howReport']) ? $data['howReport'] : null;

        // Extract doctor information
        $doctor = isset($data['doctor']) ? $data['doctor'] : null;

        // Extract acceptance items
        $acceptanceItems = $data['acceptanceItems'] ?? null;

        // Status handling
        $status = null; // Will be handled in the service methods

        // Extract out patient status
        $outPatient = $data['out_patient'] ?? false;

        // Create and return the DTO with all parameters in the expected order
        return new self(
            $patientId,
            $step,
            $consultationId,
            $doctorId,
            $invoiceId,
            $referrerId,
            $acceptorId,
            $referenceCode,
            $samplerGender,
            $howReport,
            $doctor,
            $acceptanceItems,
            $status,
            $outPatient
        );

    }

    public function toArray(): array
    {
        return [
            'patient_id' => $this->patientId,
            "step" => $this->step,
            'consultation_id' => $this->consultationId,
            'invoice_id' => $this->invoiceId,
            'referrer_id' => $this->referrerId,
            'acceptor_id' => $this->acceptorId,
            'doctor_id' => $this->doctorId,
            'referenceCode' => $this->referenceCode,
            'samplerGender' => $this->samplerGender,
            'howReport' => $this->howReport,
            'doctor' => $this->doctor,
            'status' => $this->status,
            'out_patient' => $this->outPatient,
        ];
    }
}
