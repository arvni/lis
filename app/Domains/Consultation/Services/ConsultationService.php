<?php

namespace App\Domains\Consultation\Services;

use App\Domains\Consultation\DTOs\ConsultationDTO;
use App\Domains\Consultation\Enums\ConsultationStatus;
use App\Domains\Consultation\Models\Consultant;
use App\Domains\Consultation\Models\Consultation;
use App\Domains\Consultation\Repositories\ConsultantRepository;
use App\Domains\Consultation\Repositories\ConsultationRepository;
use App\Domains\Consultation\Repositories\TimeRepository;
use App\Domains\Setting\Repositories\SettingRepository;
use Carbon\Carbon;
use Exception;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use InvalidArgumentException;
use Log;

class ConsultationService
{
    protected ConsultationRepository $consultationRepository;
    protected SettingRepository $settingRepository;
    protected ConsultantRepository $consultantRepository;
    protected TimeRepository $timeRepository;

    public function __construct(
        ConsultationRepository $consultationRepository,
        SettingRepository      $settingRepository,
        ConsultantRepository   $consultantRepository,
        TimeRepository         $timeRepository
    )
    {
        $this->consultationRepository = $consultationRepository;
        $this->settingRepository = $settingRepository;
        $this->consultantRepository = $consultantRepository;
        $this->timeRepository = $timeRepository;
    }

    public function listConsultations(array $filters): LengthAwarePaginator
    {
        return $this->consultationRepository->listConsultation($filters);
    }

    public function getRecentConsultations(array $array): Collection
    {
        return $this->consultationRepository->getAll($array);
    }

    public function createConsultation(ConsultationDTO $consultationDTO): Consultation
    {
        $consultation = $this->consultationRepository->createConsultation($consultationDTO->toArray());
        $dueDate = Carbon::parse($consultationDTO->dueDate, "Asia/Muscat");
        $this->timeRepository->createTime([
            "consultant_id" => $consultationDTO->consultantId,
            "reservable_type" => "consultation",
            "reservable_id" => $consultation->id,
            "title" => $dueDate->format("H:i"),
            "started_at" => $dueDate,
            "ended_at" => $dueDate->copy()->addMinutes(30),
            "active" => true,
        ]);
        return $consultation;
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
        $consultation->time()->delete();
        $this->consultationRepository->deleteConsultation($consultation);
    }

    public function getAvailableTimeSlots(int $consultantId, string $date): array
    {
        // Get the consultant
        $consultant = $this->consultantRepository->find($consultantId);
        if (!$consultant) {
            throw new InvalidArgumentException("Consultant not found");
        }

        // Get consultation settings
        $consultationSettings = $this->settingRepository->getSettingsByClass("Consultation");

        return $this->generateAndCheckTimeSlots($date, $consultationSettings["consultationDuration"] ?? 30, $consultant);
    }

    public function startConsultation(Consultation $consultation)
    {
        $this->consultationRepository->updateConsultation($consultation, [
            "status" => ConsultationStatus::STARTED,
            "started_at" => Carbon::now("Asia/Muscat")
        ]);
    }

    /**
     * Generate available time slots based on consultant's schedule for a given date
     *
     * @param string $date The date in Y-m-d format
     * @param int $duration Duration of each slot in minutes
     * @param Consultant $consultant The consultant whose schedule we're checking
     * @param int $advanceBookingMinutes Minimum minutes required before a booking (defaults to 0)
     * @return array Array of available time slots with their status and metadata
     */
    private function generateAndCheckTimeSlots(string $date, int $duration, Consultant $consultant, int $advanceBookingMinutes = 0): array
    {
        // Validate input parameters
        try {
            $dateCarbon = Carbon::createFromFormat('Y-m-d', $date);
        } catch (Exception $e) {
            Log::error("Invalid date format: {$date}", ['exception' => $e]);
            return [];
        }

        if ($duration <= 0) {
            Log::warning("Invalid duration provided: {$duration}");
            return [];
        }

        $timezone = 'Asia/Muscat';

        // Get the day of week and adjust to app's convention (0=Saturday, 6=Friday)
        $adjustedDayOfWeek = ($dateCarbon->dayOfWeek + 1) % 7;

        // Get the time ranges for the specific day
        $dayTimeRanges = $consultant->default_time_table[$adjustedDayOfWeek] ?? [];

        // If no time ranges are available for the day, return empty array
        if (empty($dayTimeRanges)) {
            return [];
        }

        // Eager load consultant's booked times for the given date
        $consultant->load([
            "times" => function ($query) use ($date, $timezone) {
                $query->where("started_at", ">=", Carbon::parse($date, $timezone)->startOfDay())
                    ->where("ended_at", "<=", Carbon::parse($date, $timezone)->endOfDay());
            },
        ]);

        // Cache the consultant's booked times to avoid repeated queries
        $bookedTimes = $consultant->times;

        // Create a closure for checking if a time slot is booked
        $isTimeBooked = function (Carbon $startTime,) use ($bookedTimes, $timezone) {
            return $bookedTimes->contains(function ($booking) use ($startTime, $timezone) {
                $startedDate = Carbon::parse($booking->started_at, $timezone);
                $endedDate = Carbon::parse($booking->ended_at, $timezone);
                return $startTime->gte($startedDate) && $startTime->lt($endedDate);
            });
        };

        $timeSlots = [];
        $now = Carbon::now($timezone);
        $minimumStartTime = $now->copy()->addMinutes($advanceBookingMinutes);

        // Generate time slots for each time range
        foreach ($dayTimeRanges as $timeRange) {
            // Skip invalid time ranges
            if (!isset($timeRange['started_at']) || !isset($timeRange['ended_at'])) {
                Log::warning("Invalid time range found for consultant {$consultant->id}", $timeRange);
                continue;
            }

            try {
                // Create Carbon instances for start and end times
                $startTime = Carbon::createFromFormat('Y-m-d H:i', $date . ' ' . $timeRange['started_at'], $timezone);
                $endTime = Carbon::createFromFormat('Y-m-d H:i', $date . ' ' . $timeRange['ended_at'], $timezone);

                // Ensure time range is valid
                if ($startTime->gte($endTime)) {
                    Log::warning("Invalid time range: start >= end", [
                        'consultant_id' => $consultant->id,
                        'start' => $timeRange['started_at'],
                        'end' => $timeRange['ended_at']
                    ]);
                    continue;
                }

                // If start time is before the minimum booking time, adjust it
                if ($startTime->lt($minimumStartTime)) {
                    // Round up to the nearest slot boundary (30 or 00 minutes)
                    $minutes = $minimumStartTime->minute;
                    $startTime = $minimumStartTime->copy()->setMinute($minutes < 30 ? 30 : 0);

                    if ($minutes >= 30) {
                        $startTime->addHour();
                    }
                }

                // Generate slots with the specified duration
                while ($startTime->copy()->addMinutes($duration)->lte($endTime)) {
                    $slotEndTime = $startTime->copy()->addMinutes($duration);
                    $slotStart = $startTime->format('H:i');
                    $slotEnd = $slotEndTime->format('H:i');

                    // Check if this slot is booked
                    $isBooked = $isTimeBooked($startTime);

                    // Check if slot is still available for booking (not too soon)
                    $isTooSoon = $startTime->lt($minimumStartTime);

                    // You could add additional checks here (e.g., consultant unavailability)

                    $timeSlots[] = [
                        "disabled" => $isBooked || $isTooSoon,
                        "label" => $slotStart . "-" . $slotEnd,
                        "value" => $startTime->format("H:i"), // Serializable format
                        "isBooked" => $isBooked, // Additional metadata for UI
                        "isTooSoon" => $isTooSoon, // Additional metadata for UI
                        // You could add more metadata as needed
                    ];

                    // Move to the next slot
                    $startTime->addMinutes($duration);
                }
            } catch (Exception $e) {
                Log::error("Error processing time range", [
                    'consultant_id' => $consultant->id,
                    'time_range' => $timeRange,
                    'exception' => $e
                ]);
                continue; // Skip this range and continue with the next
            }
        }

        return $timeSlots;
    }


}
