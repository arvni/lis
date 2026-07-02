<?php

namespace App\Domains\Referrer\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateMaterialRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("update", $this->routeMaterialModel());
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $materialId = $this->routeMaterialModel()?->id;

        return [
            'sample_type' => ['required', 'array'],
            'sample_type.id' => ['required', 'exists:sample_types,id'],
            'packing_series' => ['required', 'string', 'max:255'],
            'tube_series' => ['nullable', 'string', 'max:255'],
            'barcode' => ['required', 'string', 'max:255', Rule::unique('materials', 'barcode')->ignore($materialId)],
            'tube_barcode' => ['nullable', 'string', 'max:255', Rule::unique('materials', 'tube_barcode')->ignore($materialId)],
            'manufactured_date' => ['nullable', 'date'],
            'expire_date' => ['nullable', 'date'],
            'assigned_at' => ['nullable', 'date'],
            'referrer' => ['nullable', 'array'],
            'referrer.id' => ['nullable', 'exists:referrers,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'sample_type.id.required' => 'Please select a sample type.',
            'barcode.required' => 'The barcode is required.',
            'barcode.unique' => 'This barcode is already in use.',
            'tube_barcode.unique' => 'This tube barcode is already in use.',
        ];
    }

    private function routeMaterialModel(): ?\App\Domains\Referrer\Models\Material
    {
        /** @var ?\App\Domains\Referrer\Models\Material $model */
        $model = $this->route('material');

        return $model;
    }
}
