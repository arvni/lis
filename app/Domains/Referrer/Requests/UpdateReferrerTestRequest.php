<?php

namespace App\Domains\Referrer\Requests;

use App\Domains\Laboratory\Enums\MethodPriceType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateReferrerTestRequest extends FormRequest
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
            'referrer.id' => [
                'required',
                'integer',
                'exists:referrers,id'
            ],
            'test.id' => [
                'required',
                'integer',
                'exists:tests,id', Rule::unique("referrer_tests", "test_id")
                    ->where('referrer_id', $this->input('referrer.id'))
                    ->whereNot("id", $this->route()->parameter("referrer_test")->id)],
            'methods.*.method_id' => [
                'required',
                'integer',
                Rule::exists('methods', 'id')->where(function ($query) {
                    $query->whereIn('id', function ($subquery) {
                        $subquery->select('method_tests.method_id')
                            ->from('method_tests')
                            ->where('method_tests.test_id', $this->input('test.id'));
                    });
                })
            ],
            'price' => [
                'nullable',
                'numeric',
                'min:0'
            ],
            'price_type' => [
                'nullable',
                Rule::enum(MethodPriceType::class),
            ],
            'extra' => ["nullable", "array"],
            'methods.*.price' => [
                'nullable',
                'numeric',
                'min:0'
            ],
            'methods.*.price_type' => [
                'required',
                Rule::enum(MethodPriceType::class)
            ],
            'methods.*.extra.parameters' => [
                'sometimes',
                'array'
            ],
            'methods.*.extra.parameters.*.id' => [
                'nullable',
                'string'
            ],
            'methods.*.extra.parameters.*.value' => [
                'nullable',
                'string'
            ],
            'methods.*.extra.conditions' => [
                'sometimes',
                'array'
            ],
            'methods.*.extra.conditions.*.id' => [
                'nullable',
                'string'
            ],
            'methods.*.extra.conditions.*.condition' => [
                'nullable',
                'string'
            ],
            'methods.*.extra.conditions.*.value' => [
                'nullable',
                'string'
            ],
            'methods.*.extra.formula' => [
                'nullable',
                'string'
            ],
        ];
    }
}
