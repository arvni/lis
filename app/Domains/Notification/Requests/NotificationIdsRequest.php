<?php

namespace App\Domains\Notification\Requests;

use Illuminate\Foundation\Http\FormRequest;

class NotificationIdsRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Actions are scoped to the authenticated user's own notifications
        // in the repository, so a successful match is the authorization.
        return true;
    }

    /**
     * Accept either a single `id` (query/body) or an `ids` array, and
     * normalize to `ids` before validation.
     */
    protected function prepareForValidation(): void
    {
        if (!$this->has('ids') && $this->filled('id')) {
            $this->merge(['ids' => [$this->input('id')]]);
        }
    }

    public function rules(): array
    {
        return [
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['string'],
        ];
    }

    /**
     * @return array<int, string>
     */
    public function ids(): array
    {
        return $this->validated()['ids'];
    }
}
