<?php

namespace App\Domains\Laboratory\Requests;

use App\Domains\Laboratory\Models\Instruction;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class StoreInstructionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("create", Instruction::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            "name" => ["required", "string", "max:255", "unique:instructions,name"],
            "document" => ["required", "array"],
            "document.id" => ["required", "exists:documents,hash"],
        ];
    }
}
