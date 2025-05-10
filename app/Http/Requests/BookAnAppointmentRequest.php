<?php

namespace App\Http\Requests;

use App\Rules\TimeSlotAvailable;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BookAnAppointmentRequest extends FormRequest
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
     * @return array<string, mixed>
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
                new TimeSlotAvailable($this->input('consultant.id'), $this->input('dueDate')),

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
        ];
    }

    /**
     * Get custom error messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'consultant.id.required' => 'Please select a consultant.',
            'consultant.id.exists' => 'The selected consultant does not exist.',
            'dueDate.required' => 'Please select a date.',
            'dueDate.date_format' => 'The date must be in YYYY-MM-DD format.',
            'time.required' => 'Please select a time.',
            'time.date_format' => 'The time must be in HH:MM format.',
            'customer.phone.required' => 'Phone number is required.',
            'customer.phone.unique' => 'This phone number is already registered.',
            'customer.name.required' => 'Customer name is required.',
            'customer.email.email' => 'Please enter a valid email address.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Trim whitespace from inputs
        if ($this->has('customer.name')) {
            $this->merge([
                'customer' => array_merge($this->customer, [
                    'name' => trim($this->customer['name']),
                ]),
            ]);
        }

        if ($this->has('customer.email')) {
            $this->merge([
                'customer' => array_merge($this->customer, [
                    'email' => trim(strtolower($this->customer['email'] ?? '')),
                ]),
            ]);
        }
    }
}
