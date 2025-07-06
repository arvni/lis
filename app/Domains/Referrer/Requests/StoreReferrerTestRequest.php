<?php

namespace App\Domains\Referrer\Requests;

use App\Domains\Laboratory\Enums\MethodPriceType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreReferrerTestRequest extends FormRequest
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
            'referrer.id' => ['required', 'integer', 'exists:referrers,id'],
            'test.id' => [
                'required',
                'integer',
                'exists:tests,id',
                Rule::unique("referrer_tests", "test_id")
                    ->where('referrer_id', $this->input('referrer.id'))
            ],
            'price' => ['nullable', 'numeric', 'min:0'],
            'price_type' => [
                'nullable',
                Rule::enum(MethodPriceType::class),
            ],
            'extra' => ["nullable", "array"],
            'methods.*.method_id' => [
                'required',
                'integer',
                Rule::exists('methods', 'id')->where(function ($query) {
                    $query->whereIn('id', function ($subquery) {
                        $subquery->select('method_tests.method_id')
                            ->from('method_tests')
                            ->where('method_tests.test_id', $this->input('test.id'));
                    });
                }),
            ],
            'methods.*.price' => ['nullable', 'numeric', 'min:0'],
            'methods.*.price_type' => ['required', Rule::enum(MethodPriceType::class)],
            'methods.*.extra.parameters' => ['sometimes', 'array'],
            'methods.*.extra.parameters.*.id' => ['nullable', 'string'],
            'methods.*.extra.parameters.*.value' => ['nullable', 'string'],
            'methods.*.extra.conditions' => ['sometimes', 'array'],
            'methods.*.extra.conditions.*.id' => ['nullable', 'string'],
            'methods.*.extra.conditions.*.condition' => ['nullable', 'string'],
            'methods.*.extra.conditions.*.value' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'referrer.id.required' => 'A referrer ID is required.',
            'referrer.id.exists' => 'The selected referrer does not exist.',
            'methods.*.price_type.enum' => 'The price type must be either Conditional or Fixed.',
            'methods.*.id.required' => 'A method ID is required.',
            'methods.*.id.exists' => 'The selected method does not exist.',
            'test.id.unique' => 'The selected test is already associated with the referrer.',
        ];
    }
}
