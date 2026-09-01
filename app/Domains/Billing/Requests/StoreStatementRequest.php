<?php

declare(strict_types=1);

namespace App\Domains\Billing\Requests;

use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Models\Statement;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class StoreStatementRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows('create', Statement::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            "invoices"=>["required","array","min:1"],
            "invoices.*.id" => [
                "required",
                Rule::exists('invoices', 'id')
                    ->whereNull('statement_id')
                    // A cancelled invoice bills nobody, so it cannot go on a statement.
                    ->whereNot('status', InvoiceStatus::CANCELED->value)
            ],
            "referrer.id" => "required|exists:referrers,id",
        ];
    }
}
