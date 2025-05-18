<?php

namespace App\Domains\Billing\Requests;

use App\Domains\Billing\Enums\PaymentMethod;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdatePaymentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("update", $this->route()->parameter("payment"));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'information' => 'nullable|array',
            'information.receiptReferenceCode' => [
                'required_if:paymentMethod,card',
                'string',
                'max:255',
            ],
            'information.transferReference' => [
                'required_if:paymentMethod,transfer',
                'string',
                'max:255',
            ],
            'invoice_id' => 'required|integer|exists:invoices,id',
            'payer' => 'required|array',
            'payer.type' => 'required|string|in:patient,referrer',
            'payer.id' => [
                'required',
                'integer',
                function ($attribute, $value, $fail) {
                    $type = request('payer.type');
                    if ($type === 'patient' && !DB::table('patients')->where('id', $value)->exists())
                        $fail('The selected patient does not exist.');
                    elseif ($type === 'referrer' && !DB::table('referrers')->where('id', $value)->exists())
                        $fail('The selected referrer does not exist.');
                },
            ],
            'paymentMethod' => ['required', 'string', Rule::enum(PaymentMethod::class)],
            'price' => [
                'required',
                'numeric',
                'min:0.01'
            ],
        ];
    }
}
