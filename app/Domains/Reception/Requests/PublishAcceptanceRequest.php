<?php

namespace App\Domains\Reception\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class PublishAcceptanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Publishing finalizes the acceptance's samples — gate on editing the acceptance.
        return Gate::allows("update", $this->route("acceptance"));
    }

    public function rules(): array
    {
        return [
            'silently_publish' => ['nullable', 'boolean'],
        ];
    }
}
