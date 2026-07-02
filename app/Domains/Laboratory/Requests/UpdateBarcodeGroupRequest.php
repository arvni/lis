<?php

namespace App\Domains\Laboratory\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class UpdateBarcodeGroupRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("update", $this->routeBarcodeGroupModel());
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [

            "name" => [
                "required",
                "string",
                "unique:barcode_groups,name," . $this->routeBarcodeGroupModel()->id
            ],
            "abbr" => [
                "required",
                "string",
                "max:4",
                "unique:barcode_groups,abbr," . $this->routeBarcodeGroupModel()->id
            ],
        ];
    }

    private function routeBarcodeGroupModel(): \App\Domains\Laboratory\Models\BarcodeGroup
    {
        /** @var \App\Domains\Laboratory\Models\BarcodeGroup $model */
        $model = $this->route('barcodeGroup');

        return $model;
    }
}
