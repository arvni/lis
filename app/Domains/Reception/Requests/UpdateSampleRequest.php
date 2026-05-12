<?php

namespace App\Domains\Reception\Requests;

use App\Domains\Reception\Models\Sample;
use Illuminate\Foundation\Http\FormRequest;

class UpdateSampleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', Sample::class);
    }

    public function rules(): array
    {
        $sampleId = $this->route('sample')?->id;

        return [
            'barcode' => ['required', 'string', 'max:255', "unique:samples,barcode,{$sampleId}"],
        ];
    }
}
