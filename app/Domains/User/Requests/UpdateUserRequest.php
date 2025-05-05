<?php

namespace App\Domains\User\Requests;

use DB;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("update", $this->route()->parameter("user"));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            "name" => ["required", "string", "max:255"],
            "username" => ["required", "string", "max:255", "unique:users,username," . $this->route()->parameter('user')->id],
            "email" => ["required", "string", "email", "max:255", "unique:users,email," . $this->route()->parameter('user')->id],
            "mobile" => ["required", "string", "max:255"],
            "title" => ["nullable", "string", "max:255"],
            'stamp' => ['nullable',],
            'signature' => ['nullable'],
            "roles" => ["required", "array", "min:1"],
            "roles.*.id" => ["required", "exists:roles,id"]
        ];
    }
}
