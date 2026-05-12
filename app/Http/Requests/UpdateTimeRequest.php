<?php

namespace App\Http\Requests;

use App\Rules\TimeSlotAvailable;
use Carbon\Carbon;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTimeRequest extends FormRequest
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
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $time = $this->route('time');
        $isCustomer = $time?->reservable_type === 'customer';
        $customerId = $this->input('customer.id');

        $rules = [
            "consultant.id" => "required|exists:consultants,id",
            "dueDate" => [
                "required",
                "date_format:Y-m-d",
                function ($attribute, $value, $fail) {
                    $date = Carbon::createFromFormat("Y-m-d", $value);
                    if ($date->lessThan(Carbon::now()->startOfDay())) {
                        $fail("Due date must be today or later.");
                    }
                },
            ],
            "time" => [
                "required",
                "date_format:H:i",
                new TimeSlotAvailable($this->input('consultant.id'), $this->input('dueDate'), $time?->id),
            ],
            "note" => "nullable|string",
        ];

        if ($isCustomer) {
            $rules["customer"] = "required|array";
            $rules["customer.id"] = "nullable|exists:customers,id";
            $rules["customer.phone"] = [
                "required",
                "string",
                Rule::unique('customers', 'phone')->ignore($customerId),
            ];
            $rules["customer.name"] = "required|string|max:255";
            $rules["customer.email"] = "nullable|email|max:255";
        }

        return $rules;
    }
}
