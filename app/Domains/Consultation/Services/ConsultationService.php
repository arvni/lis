<?php

namespace App\Domains\Consultation\Services;

use App\Domains\Consultation\DTOs\ConsultationDTO;
use App\Domains\Consultation\Enums\ConsultationStatus;
use App\Domains\Consultation\Models\Consultation;
use App\Domains\Consultation\Repositories\ConsultationRepository;
use App\Domains\Setting\Repositories\SettingRepository;
use App\Domains\User\Models\User;
use App\Domains\User\Repositories\UserRepository;
use Carbon\Carbon;
use Exception;
use Illuminate\Pagination\LengthAwarePaginator;
use InvalidArgumentException;

class ConsultationService
{
    protected ConsultationRepository $consultationRepository;
    protected SettingRepository $settingRepository;
    protected UserRepository $userRepository;

    public function __construct(
        ConsultationRepository $consultationRepository,
        SettingRepository      $settingRepository,
        UserRepository         $userRepository
    )
    {
        $this->consultationRepository = $consultationRepository;
        $this->settingRepository = $settingRepository;
        $this->userRepository = $userRepository;
    }

    public function listConsultations(array $filters): LengthAwarePaginator
    {
        return $this->consultationRepository->listConsultation($filters);
    }

    public function createConsultation(ConsultationDTO $consultationDTO): Consultation
    {
        return $this->consultationRepository->createConsultation($consultationDTO->toArray());
    }

    public function updateConsultation(Consultation $consultation, ConsultationDTO $newConsultationDTO): Consultation
    {

        return $this->consultationRepository->updateConsultation($consultation, $newConsultationDTO->toArray());
    }

    /**
     * @throws Exception
     */
    public function deleteConsultation(Consultation $consultation): void
    {
        $this->consultationRepository->deleteConsultation($consultation);
    }

    public function getAvailableTimeSlots(int $consultantId, string $date): array
    {
        // Get the consultant
        $consultant = $this->userRepository->find($consultantId);
        if (!$consultant) {
            throw new InvalidArgumentException("Consultant not found");
        }

        // Get consultation settings
        $consultationSettings = $this->settingRepository->getSettingsByClass("Consultation");
        $fromTime = $consultationSettings['consultationStart'] ?? "09:00";
        $toTime = $consultationSettings['consultationEnd'] ?? "17:00";
        $duration = $consultationSettings['consultationDuration'] ?? 30;


        // Generate time slots
        $from = Carbon::createFromFormat("Y-m-d H:i", $date . " " . $fromTime)->setSeconds(0);
        $to = Carbon::createFromFormat("Y-m-d H:i", $date . " " . $toTime)->setSeconds(0);
        if ($to->lessThan(Carbon::now())) {
            return [];
        }
        if ($from->lessThan(Carbon::now())) {
            $from = Carbon::now();
        }

        return $this->generateAndCheckTimeSlots($from, $to, $duration, $consultant);
    }

    public function startConsultation(Consultation $consultation)
    {
        $this->consultationRepository->updateConsultation($consultation, [
            "status" => ConsultationStatus::STARTED,
            "started_at" => Carbon::now("Asia/Muscat")
        ]);
    }

    /**
     * Generate time slots and check their availability
     *
     * @param Carbon $from Start time
     * @param Carbon $to End time
     * @param int $duration Duration in minutes
     * @param User $consultant Consultant
     * @return array Available time slots
     */
    private function generateAndCheckTimeSlots(Carbon $from, Carbon $to, int $duration, User $consultant): array
    {
        $timeSlots = [];
        $current = clone $from;
        while ($current->lessThan($to)) {
            $slotEnd = (clone $current)->addMinutes($duration);
            // Only add future time slots
            if ($current->gt(Carbon::now())) {
                $isBooked = $this->consultationRepository->isTimeSlotBooked(
                    $consultant,
                    $current,
                    $slotEnd
                );

                $timeSlots[] = [
                    "disabled" => $isBooked,
                    "label" => $current->format("H:i") . "-" . $slotEnd->format("H:i"),
                    "value" => $current->format("H:i:s")
                ];
            }

            $current->addMinutes($duration);
        }


        return $timeSlots;
    }

}
