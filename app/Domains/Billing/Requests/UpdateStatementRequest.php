<?php

declare(strict_types=1);

namespace App\Domains\Billing\Requests;

use App\Domains\Billing\Enums\InvoiceStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateStatementRequest extends StoreStatementRequest
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
        $rules = parent::rules();
        $rules['invoices.*.id'] = [
            'required',
            Rule::exists('invoices', 'id')
                ->where(function ($query) {
                    // Nothing cancelled may be added, but an invoice already on this
                    // statement stays valid even if it was cancelled afterwards.
                    $query->where(function ($q) {
                        $q->whereNull('statement_id')
                            ->where('status', '!=', InvoiceStatus::CANCELED->value);
                    })->orWhere('statement_id', '=', $this->route('statement')->id);
                }),
        ];
        unset($rules['referrer.id']);

        return $rules;
    }
}
