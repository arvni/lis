<?php

namespace App\Domains\Laboratory\Requests;

use App\Domains\Laboratory\Models\SampleType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class StoreSampleTypeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("create", SampleType::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            "name" => ["required", "string", "unique:sample_types,name"],
            "description" => ["nullable", "string"],
            "orderable" => ["nullable", "boolean"],
        ];
    }
}
