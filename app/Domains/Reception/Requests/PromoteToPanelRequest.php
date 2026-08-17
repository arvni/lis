<?php

declare(strict_types=1);

namespace App\Domains\Reception\Requests;

use App\Domains\Reception\Models\Acceptance;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PromoteToPanelRequest extends FormRequest
{
    public function authorize(): bool
    {
        $acceptance = $this->route('acceptance');

        // Rewrites the acceptance's items — gate on editing the acceptance.
        return $acceptance instanceof Acceptance
            && (bool) $this->user()?->can('update', $acceptance);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        // authorize() has already rejected anything but a bound acceptance.
        $acceptance = $this->route('acceptance');
        $acceptanceId = $acceptance instanceof Acceptance ? $acceptance->id : 0;

        return [
            'acceptance_item_ids' => ['required', 'array', 'min:1'],
            // Only live items of the acceptance being authorized may be rewritten.
            'acceptance_item_ids.*' => [
                'required',
                'integer',
                Rule::exists('acceptance_items', 'id')
                    ->where('acceptance_id', $acceptanceId)
                    ->whereNull('deleted_at'),
            ],
            // The panel's composition is read back from the server before submitting,
            // so the only requirement here is that it resolves to at least one
            // MethodTest: a panel configured with a single method test (tests are
            // stored with `method_tests` min:1) is still a valid promotion target.
            'panel_method_tests' => ['required', 'array', 'min:1'],
            'panel_method_tests.*' => ['required', 'integer', 'exists:method_tests,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'panel_method_tests.required' => 'The selected panel has no tests configured.',
            'acceptance_item_ids.*.exists' => 'One of the selected tests does not belong to this acceptance.',
        ];
    }
}
