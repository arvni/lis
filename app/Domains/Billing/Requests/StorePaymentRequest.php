<?php

namespace App\Domains\Billing\Requests;

use App\Domains\Billing\Enums\PaymentMethod;
use App\Domains\Billing\Models\Payment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class StorePaymentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("create", Payment::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules()
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

                    if ($type === 'patient' && !DB::table('patients')->where('id', $value)->exists()) {
                        $fail('The selected patient does not exist.');
                    } elseif ($type === 'referrer' && !DB::table('referrers')->where('id', $value)->exists()) {
                        $fail('The selected referrer does not exist.');
                    }
                },
            ],
            'paymentMethod' => ['required','string',Rule::enum(PaymentMethod::class)],
            'price' => [
                'required',
                'numeric',
                'min:0.01'
            ],
        ];
    }

// Custom validation messages
    public function messages()
    {
        return [
            'information.required' => 'Payment information is required.',
            'information.receiptReferenceCode.required_if' => 'The receipt reference code is required when using card payment.',
            'invoice_id.required' => 'The invoice ID is required.',
            'invoice_id.exists' => 'The selected invoice does not exist.',
            'payer.required' => 'Payer information is required.',
            'payer.type.required' => 'The payer type is required.',
            'payer.type.in' => 'The payer type must be either patient or referrer.',
            'payer.id.required' => 'The payer ID is required.',
            'payer.name.required' => 'The payer name is required.',
            'paymentMethod.required' => 'The payment method is required.',
            'paymentMethod.in' => 'The payment method must be cash, card, or credit.',
            'price.required' => 'The payment amount is required.',
            'price.numeric' => 'The payment amount must be a number.',
            'price.min' => 'The payment amount must be at least 0.01.',
        ];
    }
}
