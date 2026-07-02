<?php

namespace App\Domains\Referrer\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateOrderMaterialRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("update", $this->routeOrderMaterialModel());
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            "sample_type_id" => ["required", Rule::exists("sample_types", "id")->where("orderable", true)],
            'materials' => ['required', 'array', 'min:' . $this->routeOrderMaterialModel()->amount],
            'materials.*.id' => [
                "required",
                Rule::exists("materials", "id")
                    ->where("sample_type_id", $this->input("sample_type_id"))
                    ->whereNull("order_material_id")
                    ->whereNull("assigned_at")
            ],
        ];
    }

    private function routeOrderMaterialModel(): \App\Domains\Referrer\Models\OrderMaterial
    {
        /** @var \App\Domains\Referrer\Models\OrderMaterial $model */
        $model = $this->route('orderMaterial');

        return $model;
    }
}
