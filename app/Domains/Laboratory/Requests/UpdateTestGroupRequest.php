<?php

namespace App\Domains\Laboratory\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class UpdateTestGroupRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("update", $this->routeTestGroupModel());
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            "name" => ["required", "string", "max:255", "unique:test_groups,name," . $this->routeTestGroupModel()->id],
        ];
    }

    private function routeTestGroupModel(): \App\Domains\Laboratory\Models\TestGroup
    {
        /** @var \App\Domains\Laboratory\Models\TestGroup $model */
        $model = $this->route('testGroup');

        return $model;
    }
}
