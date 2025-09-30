<?php

namespace App\Domains\Referrer\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class UpdateReferrerRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("update", $this->route()->parameter("referrer"));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            "fullName" => ["required", "string", "max:255"],
            "email" => ["required", "string", "email", "max:255", "unique:referrers,email," . $this->route()->parameter("referrer")->id],
            "phoneNo" => ["required", "string", "max:255"],
            "billingInfo.name" => ["nullable", "string", "max:255"],
            "billingInfo.address" => ["nullable", "string", "max:255"],
            "billingInfo.vatIn" => ["nullable", "string", "max:255"],
            "billingInfo.phone" => ["nullable", "string", "max:255"],
            "billingInfo.email" => ["nullable", "string", "email", "max:255"],
            "billingInfo.city" => ["nullable", "string", "max:255"],
            "billingInfo.country" => ["nullable", "string", "max:255"],
            "isActive" => ["nullable", "boolean"],
            "reportReceivers" => ["nullable", "array"],
        ];
    }
}
