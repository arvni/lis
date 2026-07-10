<?php

namespace App\Domains\Referrer\Requests;

use App\Domains\Referrer\Models\Referrer;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Gate;

class UpdateReferrerRequest extends StoreReferrerRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows('update', $this->routeReferrerModel());
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = parent::rules();
        $rules['email'] = ['required', 'string', 'email', 'max:255', 'unique:referrers,email,'.$this->routeReferrerModel()->id];

        return $rules;
    }

    private function routeReferrerModel(): Referrer
    {
        /** @var Referrer $model */
        $model = $this->route('referrer');

        return $model;
    }
}
