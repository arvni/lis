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
        $customerId = $this->input('customer.id');
        return [
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
                new TimeSlotAvailable($this->input('consultant.id'), $this->input('dueDate'), $this->route()->parameter('time')->id),

            ],
            "customer" => "required|array",
            "customer.id" => "nullable|exists:customers,id",
            "customer.phone" => [
                "required",
                "string",
                Rule::unique('customers', 'phone')->ignore($customerId),
            ],
            "customer.name" => "required|string|max:255",
            "customer.email" => "nullable|email|max:255",
            "note" => "nullable|string",
        ];
    }
}
