<?php

namespace App\Domains\Laboratory\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class UpdateInstructionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("update", $this->routeInstructionModel());
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            "name" => ["required", "string", "max:255", "unique:instructions,name," . $this->routeInstructionModel()->id],
            "document" => ["required", "array"],
            "document.id" => ["required", "exists:documents,hash"],
        ];
    }

    private function routeInstructionModel(): \App\Domains\Laboratory\Models\Instruction
    {
        /** @var \App\Domains\Laboratory\Models\Instruction $model */
        $model = $this->route('instruction');

        return $model;
    }
}
