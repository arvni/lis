<?php

namespace App\Domains\Referrer\Requests;

use App\Domains\Referrer\Models\Material;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class StoreMaterialRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("create", Material::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules()
    {
        return [
            'sample_type.id' => 'required|exists:sample_types,id',
            'number_of_tubes' => 'required|integer|min:1|max:100',
            'tubes' => 'required|array|min:1',
            'tubes.*.tube_barcode' => 'nullable|string|unique:materials,tube_barcode',
            'tubes.*.expire_date' => 'nullable|date|after:today',
        ];
    }
}
