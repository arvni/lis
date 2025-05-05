<?php

namespace App\Domains\Laboratory\Requests;

use App\Domains\Laboratory\Models\BarcodeGroup;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class StoreBarcodeGroupRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("create", BarcodeGroup::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            "name" => ["required", "string", "unique:barcode_groups,name"],
            "abbr" => ["required", "string", "unique:barcode_groups,abbr", "max:4"],
        ];
    }
}
