<?php

namespace App\Domains\Laboratory\Requests;

use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\Test;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Gate;

class UpdateTestRequest extends StoreTestRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows('update', $this->routeTestModel());
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = parent::rules();

        $rules['name'] = ['required', 'string', 'max:255', 'unique:tests,name,'.$this->routeTestModel()->id];
        $rules['code'] = ['required', 'string', 'max:50', 'unique:tests,code,'.$this->routeTestModel()->id];
        $rules['method_tests.*.id'] = ['nullable'];

        // Panel rules already allow nullable status via StoreTestRequest.
        if ($this->input('type') !== TestType::PANEL->value) {
            $rules['method_tests.*.status'] = ['boolean'];
        }
        if (in_array($this->input('type'), [TestType::TEST->value, TestType::SERVICE->value], true)) {
            $rules['method_tests.*.method.id'] = ['nullable'];
        }

        return $rules;
    }

    private function routeTestModel(): Test
    {
        /** @var Test $model */
        $model = $this->route('test');

        return $model;
    }
}
