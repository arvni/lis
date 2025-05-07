<?php

namespace App\Http\Requests;

use Carbon\Carbon;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            "consultant.id" => "required|exists:consultants,id",
            "dueDate" => ["required", function ($attribute, $value, $fail) {
                $date = Carbon::createFromFormat("Y-m-d", $value);
                if ($date->lessThanOrEqualTo(Carbon::now()->startOfDay()))
                    $fail("Due Date Must Be Grater Than Now");
            }],
            "time" => ["required"],
            "customer" => "required|array",
            "customer.id" => "nullable|exists:customers,id",
            "customer.phone" => [Rule::excludeIf(fn() => $this->input("consultant.id")), "required", "unique:customers,phone"],
            "customer.name" => "required",
            "customer.email" => "nullable|email",
        ];
    }
}
