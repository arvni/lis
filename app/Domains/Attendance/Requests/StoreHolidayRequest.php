<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Requests;

use App\Domains\Attendance\Models\Holiday;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class StoreHolidayRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('create', Holiday::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'date' => ['required', 'date_format:Y-m-d', Rule::unique('holidays', 'date')->ignore($this->route('holiday'))],
            'title' => 'required|string|max:255',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'date.unique' => 'This date is already a holiday.',
        ];
    }
}
