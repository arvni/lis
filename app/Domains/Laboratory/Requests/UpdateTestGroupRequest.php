<?php

namespace App\Domains\Laboratory\Requests;

use App\Domains\Laboratory\Models\TestGroup;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Gate;

class UpdateTestGroupRequest extends StoreTestGroupRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows('update', $this->routeTestGroupModel());
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = parent::rules();
        $rules['name'] = ['required', 'string', 'max:255', 'unique:test_groups,name,'.$this->routeTestGroupModel()->id];

        return $rules;
    }

    private function routeTestGroupModel(): TestGroup
    {
        /** @var TestGroup $model */
        $model = $this->route('testGroup');

        return $model;
    }
}
