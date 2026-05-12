<?php

namespace App\Domains\Reception\Requests;

use App\Domains\Reception\Enums\AcceptancePriority;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rules\Enum;

class UpdateAcceptancePriorityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('Reception.Acceptances.Update Priority');
    }

    public function rules(): array
    {
        return [
            'priority' => ['required', new Enum(AcceptancePriority::class)],
        ];
    }
}
