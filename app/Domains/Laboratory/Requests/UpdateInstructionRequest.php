<?php

namespace App\Domains\Laboratory\Requests;

use App\Domains\Laboratory\Models\Instruction;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Gate;

class UpdateInstructionRequest extends StoreInstructionRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows('update', $this->routeInstructionModel());
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = parent::rules();
        $rules['name'] = ['required', 'string', 'max:255', 'unique:instructions,name,'.$this->routeInstructionModel()->id];

        return $rules;
    }

    private function routeInstructionModel(): Instruction
    {
        /** @var Instruction $model */
        $model = $this->route('instruction');

        return $model;
    }
}
