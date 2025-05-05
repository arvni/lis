<?php

namespace App\Domains\Laboratory\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateDocumentBatchUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            "documents" => ["required", "array"],
            "documents.*.id" => ["required", "exists:documents,hash"],
            "documents.*.tag" => ["nullable"],
            "ownerId" => ["required", "integer"],
            "ownerClass" => ["required", "string"],
            "relatedId" => ["nullable", "integer"],
            "relatedClass" => ["nullable", "string"],
            "tag" => ["nullable", "string"],
        ];
    }
}
