<?php

namespace App\Http\Requests;

use Carbon\Carbon;
use DB;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreTimeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            "consultant_id"=>["required","exists:consultants,id"],
            "date"=>["required","date","date_format:Y-m-d","after_or_equal:today"],
            "startTime"=>[
                "required",
                "date_format:H:i",
                function ($attribute, $value, $fail) {
                    $dateTime = Carbon::createFromFormat("Y-m-d H:i", $this->input('date') . " " . $value,"Asia/Muscat");
                    $endDateTime = Carbon::createFromFormat("Y-m-d H:i", $this->input('date') . " " . $this->input("endTime"),"Asia/Muscat");

                    // Check for time slot availability
                    $exists = DB::table("times")
                        ->where("consultant_id", $this->input('consultant_id'))
                        ->where(function ($query) use ($dateTime,$endDateTime) {
                            $query->where("started_at", "<=", $dateTime)
                                ->where("ended_at", ">", $dateTime);
                            $query->orWhereBetween("started_at", [$dateTime,$endDateTime]);
                        })
                        ->exists();

                    if ($exists) {
                        $fail("The selected time slot is already have booked time.");
                    }
                },
                ],
            "endTime"=>[
                "required",
                "date_format:H:i",
                function ($attribute, $value, $fail) {
                    $dateTime = Carbon::createFromFormat("Y-m-d H:i", $this->input('date') . " " . $value,"Asia/Muscat");
                    $startDateTime = Carbon::createFromFormat("Y-m-d H:i", $this->input('date') . " " . $this->input("startTime"),"Asia/Muscat");

                    // Check for time slot availability
                    $exists = DB::table("times")
                        ->where("consultant_id", $this->input('consultant_id'))
                        ->where(function ($query) use ($dateTime, $startDateTime) {
                            $query->where("started_at", "<=", $dateTime)
                                ->where("ended_at", ">", $dateTime);
                            $query->orWhereBetween("started_at", [$startDateTime, $dateTime]);
                        })
                        ->exists();

                    if ($exists) {
                        $fail("The selected time slot is already have booked time.");
                    }
                },
            ],
        ];
    }
}
