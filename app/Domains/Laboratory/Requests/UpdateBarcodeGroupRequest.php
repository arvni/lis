<?php

namespace App\Domains\Laboratory\Requests;

use App\Domains\Laboratory\Models\BarcodeGroup;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Gate;

class UpdateBarcodeGroupRequest extends StoreBarcodeGroupRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows('update', $this->routeBarcodeGroupModel());
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = parent::rules();
        $rules['name'] = ['required', 'string', 'unique:barcode_groups,name,'.$this->routeBarcodeGroupModel()->id];
        $rules['abbr'] = ['required', 'string', 'max:4', 'unique:barcode_groups,abbr,'.$this->routeBarcodeGroupModel()->id];

        return $rules;
    }

    private function routeBarcodeGroupModel(): BarcodeGroup
    {
        /** @var BarcodeGroup $model */
        $model = $this->route('barcodeGroup');

        return $model;
    }
}
