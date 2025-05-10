<?php

namespace App\Rules;

use Carbon\Carbon;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\DB;

class TimeSlotAvailable implements ValidationRule
{
    /**
     * The consultant ID to check availability for.
     *
     * @var int|string
     */
    protected string|int $consultantId;

    /**
     * The due date to check availability for.
     *
     * @var string
     */
    protected string $dueDate;

    /**
     * Create a new rule instance.
     *
     * @param int|string $consultantId
     * @param string $dueDate
     * @return void
     */
    public function __construct(int|string $consultantId, string $dueDate)
    {
        $this->consultantId = $consultantId;
        $this->dueDate = $dueDate;
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $dateTime = Carbon::createFromFormat("Y-m-d H:i", $this->dueDate . " " . $value, "Asia/Muscat");

        // Check if time slot is available (return true if NO overlapping appointments exist)
        $exists = DB::table("times")
            ->where("consultant_id", $this->consultantId)
            ->where("started_at", "<=", $dateTime)
            ->where("ended_at", ">", $dateTime)
            ->exists();
        if ($exists)
            $fail("The time slot is already booked.");
    }
}
