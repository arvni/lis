<?php

declare(strict_types=1);

namespace App\Domains\Notification\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListNotificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        // The list is scoped to the authenticated user's own notifications,
        // so there is nothing further to authorize.
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'filter' => ['nullable', Rule::in(['all', 'unread', 'read'])],
            'type' => ['nullable', 'string', 'max:255'],
            'search' => ['nullable', 'string', 'max:255'],
            'page' => ['nullable', 'integer', 'min:1'],
            'pageSize' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    /**
     * The filters the repository understands, with `all` normalized away.
     *
     * @return array<string, mixed>
     */
    public function filters(): array
    {
        $validated = $this->validated();

        return [
            'filter' => $validated['filter'] ?? 'all',
            'type' => ($validated['type'] ?? 'all') === 'all' ? null : $validated['type'],
            'search' => $validated['search'] ?? null,
            'pageSize' => $validated['pageSize'] ?? 10,
        ];
    }
}
