<?php

namespace App\Domains\Reception\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AddPoolingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'acceptanceItems'                                                         => 'required|array',
            'acceptanceItems.tests'                                                   => 'nullable|array',
            'acceptanceItems.tests.*.method_test.id'                                  => 'required_with:acceptanceItems.tests|exists:method_tests,id',
            'acceptanceItems.tests.*.price'                                           => 'required_with:acceptanceItems.tests|numeric|min:0',
            'acceptanceItems.tests.*.discount'                                        => 'nullable|numeric|min:0',
            'acceptanceItems.tests.*.no_sample'                                       => 'nullable|integer|min:1',
            'acceptanceItems.tests.*.customParameters'                                => 'nullable|array',
            'acceptanceItems.tests.*.details'                                         => 'nullable|string|max:500',
            'acceptanceItems.tests.*.deleted'                                         => 'nullable|boolean',

            'acceptanceItems.panels'                                                  => 'nullable|array',
            'acceptanceItems.panels.*.price'                                          => 'nullable|numeric|min:0',
            'acceptanceItems.panels.*.discount'                                       => 'nullable|numeric|min:0',
            'acceptanceItems.panels.*.deleted'                                        => 'nullable|boolean',
            'acceptanceItems.panels.*.acceptanceItems'                                => 'required_with:acceptanceItems.panels|array',
            'acceptanceItems.panels.*.acceptanceItems.*.method_test.id'               => 'required|exists:method_tests,id',
            'acceptanceItems.panels.*.acceptanceItems.*.customParameters'             => 'nullable|array',
        ];
    }
}
