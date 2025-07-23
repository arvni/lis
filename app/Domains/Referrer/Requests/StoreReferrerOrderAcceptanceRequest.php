<?php

namespace App\Domains\Referrer\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class StoreReferrerOrderAcceptanceRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows('createAcceptance', $this->route()->parameter('referrerOrder'));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [];
        $rules['referenceCode'] = 'nullable|string|max:255';
        $rules['acceptanceItems'] = 'required|array';
        $rules['acceptanceItems.tests'] = 'nullable|array';
        $rules['acceptanceItems.tests.*.id'] = 'nullable';
        $rules['acceptanceItems.tests.*.method_test.id'] = 'required|exists:method_tests,id';
        $rules['acceptanceItems.tests.*.customParameters.sampleType'] = 'required|exists:sample_types,id';
        $rules['acceptanceItems.tests.*.customParameters.price'] = 'nullable|array';
        $rules['acceptanceItems.tests.*.price'] = 'required|numeric|min:0';
        $rules['acceptanceItems.tests.*.discount'] = [
            'nullable',
            'numeric',
            'min:0',
            function ($attribute, $value, $fail) {
                $index = explode('.', $attribute)[2];
                $price = $this->input("acceptanceItems.tests.{$index}.price");
                if ($value > $price) {
                    $fail('The discount cannot be greater than the price.');
                }
                // @todo check max discount on settings
                // Add max discount check if maxDiscount is provided
                if (request()->has('maxDiscount')) {
                    $maxDiscountAmount = request()->maxDiscount * $price * 0.01;
                    if ($value > $maxDiscountAmount) {
                        $fail("The discount cannot exceed " . request()->maxDiscount . "% of the price.");
                    }
                }
            },
        ];
        $rules['acceptanceItems.tests.*.samples'] = 'required|array|min:1';
        $rules['acceptanceItems.tests.*.samples.*.sampleType'] = 'required|exists:sample_types,id';
        $rules['acceptanceItems.tests.*.samples.*.patients'] = 'required|array|min:1';
        $rules['acceptanceItems.tests.*.samples.*.patients.*.id'] = 'required|exists:patients,id';
        $rules['acceptanceItems.tests.*.details'] = 'nullable|string|max:500';
        $rules['acceptanceItems.tests.*.customParameters.discounts'] = 'nullable|array';

        // Panel validations
        $rules['acceptanceItems.panels'] = 'nullable|array';
        $rules['acceptanceItems.panels.*.id'] = 'nullable|string';
        $rules['acceptanceItems.panels.*.panel.id'] = 'required|exists:tests,id';
        $rules['acceptanceItems.panels.*.price'] = 'required|numeric|min:0';
        $rules['acceptanceItems.panels.*.discount'] = [
            'nullable',
            'numeric',
            'min:0',
            function ($attribute, $value, $fail) {
                $index = explode('.', $attribute)[2];
                $price = $this->input("acceptanceItems.panels.{$index}.panel.price");

                if ($value > $price) {
                    $fail('The discount cannot be greater than the price.');
                }

                // Add max discount check if maxDiscount is provided
                if (request()->has('maxDiscount')) {
                    $maxDiscountAmount = request()->maxDiscount * $price * 0.01;
                    if ($value > $maxDiscountAmount) {
                        $fail("The discount cannot exceed " . request()->maxDiscount . "% of the price.");
                    }
                }
            },
        ];
        $rules['acceptanceItems.panels.*.acceptanceItems'] = 'required|array';
        $rules['acceptanceItems.panels.*.acceptanceItems.*.id'] = 'nullable';
        $rules['acceptanceItems.panels.*.acceptanceItems.*.method_test.id'] = 'required|exists:method_tests,id';
        $rules['acceptanceItems.panels.*.acceptanceItems.*.samples.*.sampleType'] = 'required|exists:sample_types,id';
        $rules['acceptanceItems.panels.*.acceptanceItems.*.samples.*.patients'] = 'required|array|min:1';
        $rules['acceptanceItems.panels.*.acceptanceItems.*.samples.*.patients.*.id'] = 'required|exists:patients,id';
        $rules['acceptanceItems.panels.*.acceptanceItems.*.details'] = 'nullable|string|max:500';
        $rules['howReport.sendToReferrer'] = [
            'boolean',
            'nullable'
        ];
        return $rules;
    }
}
