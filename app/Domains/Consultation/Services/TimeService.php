<?php

namespace App\Domains\Consultation\Services;


use App\Domains\Consultation\DTOs\TimeDTO;
use App\Domains\Consultation\Models\Consultant;
use App\Domains\Consultation\Models\Time;
use App\Domains\Consultation\Repositories\TimeRepository;
use Carbon\Carbon;
use Exception;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Arr;

class TimeService
{
    public function __construct(private TimeRepository $timeRepository)
    {
    }

    public function listTimes($queryData)
    {
        return $this->timeRepository->ListTimes($queryData);
    }

    public function storeTime(TimeDTO $timeDTO)
    {
        return $this->timeRepository->createTime($timeDTO->toArray());
    }

    public function updateTime(Time $time, TimeDTO $timeDTO): Time
    {
        return $this->timeRepository->updateTime($time, $timeDTO->toArray());
    }

    /**
     * @throws Exception
     */
    public function deleteTime(Time $time): void
    {
        if (!$time->reservable()->exists()) {
            $this->timeRepository->deleteTime($time);
        } else
            throw new Exception("This Time has some Reservation");
    }

    public function getConsultantTimes(Consultant $consultant, array $all): Collection
    {
        // Get upcoming time slots for the current month
        $now = Carbon::now();
        $fromDate = (Arr::has($all, "startDate") ? Carbon::parse($all['startDate']) : $now->copy()->startOfMonth());
        $toDate = (Arr::has($all, "endDate") ? Carbon::parse($all['endDate']) : $now->copy()->startOfMonth());


        return $this->timeRepository->listTimes([
            "filters" => [
                "betweenDate" => [$fromDate, $toDate],
                "consultant_id" => $consultant->id
            ],
            "orderBy"
        ]);
    }
}
