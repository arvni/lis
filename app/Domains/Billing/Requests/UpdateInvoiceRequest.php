<?php

namespace App\Domains\Billing\Requests;

use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Enums\PaymentMethod;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateInvoiceRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows('update', $this->route()->parameter('invoice'));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            "owner_id" => "required",
            "owner_type" => "required",
            "status" => ["required", Rule::enum(InvoiceStatus::class)],
            "acceptance_items" => ["required", "array"],
            "acceptance_items.*.id" => ["required", Rule::exists("acceptance_items", "id")],
            "acceptance_items.*.price" => ["required", "numeric", "gt:0"],
            "acceptance_items.*.discount" => ["required", "numeric"],
            "acceptance_items.*.customParameters.discounts" => ["nullable", "array"],
            "payments" => ["required", "array"],
            "payments.*.id" => ["nullable", Rule::exists("payments", "id")],
            "payments.*.price" => ["required", "numeric"],
            "payments.*.payer_id" => ["required"],
            "payments.*.payer_type" => ["required"],
            "payments.*.paymentMethod" => ["required", Rule::enum(PaymentMethod::class)],
            "payments.*.information" => ["array", "nullable"],
        ];
    }
}
