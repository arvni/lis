<?php

namespace App\Domains\Consultation\DTOs;

use App\Domains\Consultation\Enums\ConsultationStatus;
use App\Domains\Consultation\Models\Consultation;
use Carbon\Carbon;

class ConsultationDTO
{
    public function __construct(
        public int                $patientId,
        public int                $consultantId,
        public string             $dueDate,
        public ConsultationStatus $status,
        public ?array             $information = [],
        public ?string            $startedAt = null,
        public ?int               $timeID = null
    )
    {
    }

    public static function fromConsultation(Consultation $consultation): self
    {
        return new self(
            $consultation->patient_id,
            $consultation->consultant_id,
            $consultation->dueDate,
            $consultation->status,
            $consultation->information,
            $consultation->started_at,
        );
    }

    public static function fromRequest(array $request): self
    {
        return new self(
            $request['patient_id'],
            $request['consultant']["id"],
            Carbon::createFromFormat("Y-m-d H:i", $request['dueDate'] . " " . $request['time'], "Asia/Muscat"),
            ConsultationStatus::WAITING,
            $request['information'] ?? [],
            $request['startedAt'] ?? null,
        );
    }

    public function toArray(): array
    {
        return [
            'patient_id' => $this->patientId,
            'consultant_id' => $this->consultantId,
            'dueDate' => $this->dueDate,
            'information' => $this->information,
            'status' => $this->status,
            'started_at' => $this->startedAt,
            "time_id" => $this->timeID,
        ];
    }
}
