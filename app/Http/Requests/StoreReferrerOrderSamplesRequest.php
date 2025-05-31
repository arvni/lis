<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class StoreReferrerOrderSamplesRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("createSamples",$this->route()->parameter("referrerOrder"));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            "barcodes" => ["required", "array"],
            "barcodes.*.patient"=>["required", "array"],
            "barcodes.*.patient.id"=>["required", "exists:patients,id"],
            "barcodes.*.sampleType" => ["required", "exists:sample_types,id"],
            "barcodes.*.items"=>["required", "array"],
            "barcodes.*.items.*.id" => ["required", "exists:acceptance_items,id"],
            "barcodes.*.collection_date" => ["required"],
            "barcodes.*.sampleLocation" => ["required"],
            "barcodes.*.barcodeGroup" => ["required","array"],
        ];
    }
}
