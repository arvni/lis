<?php

namespace App\Domains\Billing\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateStatementRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows('update', $this->route('statement'));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            "invoices" => ["required", "array", "min:1"],
            "invoices.*.id" => [
                "required",
                Rule::exists('invoices', 'id')
                    ->where(function ($query) {
                        $query->whereNull('statement_id')
                            ->orWhere('statement_id', '=', $this->route('statement')->id);
                    })
            ],
            "issue_date" => "required|date_format:Y-m-d",
        ];
    }
}
