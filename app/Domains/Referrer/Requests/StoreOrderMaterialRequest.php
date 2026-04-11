<?php

namespace App\Domains\Referrer\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOrderMaterialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Domains\Referrer\Models\OrderMaterial::class);
    }

    public function rules(): array
    {
        return [
            'referrer_id'    => ['required', Rule::exists('referrers', 'id')],
            'sample_type_id' => ['required', Rule::exists('sample_types', 'id')->where('orderable', true)],
            'amount'         => ['required', 'integer', 'min:1'],
            'materials'      => ['nullable', 'array'],
            'materials.*.id' => [
                'required',
                Rule::exists('materials', 'id')
                    ->where('sample_type_id', $this->input('sample_type_id'))
                    ->whereNull('order_material_id')
                    ->whereNull('assigned_at'),
            ],
        ];
    }
}
