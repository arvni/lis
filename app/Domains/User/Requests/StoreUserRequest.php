<?php

namespace App\Domains\User\Requests;

use App\Domains\User\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class StoreUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("create", User::class);
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
            "username" => ["required", "string", "max:255", "unique:users,username"],
            "email" => ["required", "string", "email", "max:255", "unique:users,email"],
            "mobile" => ["required", "string", "max:255"],
            "password" => ["required", "string", "min:8"],
            "password_confirmation" => ["required", "string", "same:password"],
            "title" => ["nullable", "string", "max:255"],
            'stamp' => ['nullable',],
            'signature' => ['nullable'],
            "roles" => ["required", "array", "min:1"],
            "roles.*.id" => ["required", "exists:roles,id"],
            "is_active"=>["required", "boolean"],
        ];
    }
}
