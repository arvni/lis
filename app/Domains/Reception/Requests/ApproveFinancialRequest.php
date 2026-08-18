<?php

declare(strict_types=1);

namespace App\Domains\Reception\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class ApproveFinancialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('approveFinancial', $this->route('acceptance'));
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            // Set by the confirmation dialog when the reviewer knowingly signs
            // off on an acceptance that has no invoice.
            'approve_without_invoice' => ['nullable', 'boolean'],
        ];
    }
}
