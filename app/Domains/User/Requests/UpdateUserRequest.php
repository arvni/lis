<?php

namespace App\Domains\User\Requests;

use App\Domains\User\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Gate;

class UpdateUserRequest extends StoreUserRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows('update', $this->routeUserModel());
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = parent::rules();
        $rules['username'] = ['required', 'string', 'max:255', 'unique:users,username,'.$this->routeUserModel()->id];
        $rules['email'] = ['required', 'string', 'email', 'max:255', 'unique:users,email,'.$this->routeUserModel()->id];
        unset($rules['password'], $rules['password_confirmation']);

        return $rules;
    }

    private function routeUserModel(): User
    {
        /** @var User $model */
        $model = $this->route('user');

        return $model;
    }
}
