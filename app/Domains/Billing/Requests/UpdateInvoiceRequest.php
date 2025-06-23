<?php

namespace App\Domains\Billing\Requests;

use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Models\Invoice;
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
        ];
    }
}
