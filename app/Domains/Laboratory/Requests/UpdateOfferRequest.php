<?php

namespace App\Domains\Laboratory\Requests;

use App\Domains\Laboratory\Enums\OfferType;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateOfferRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("update", $this->route()->parameter("offer"));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules()
    {
        $rules = [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'type' => ['required', Rule::in(OfferType::names())],
            'tests' => 'nullable|array',
            'tests.*.id' => 'exists:tests,id',
            'referrers' => 'nullable|array',
            'referrers.*.id' => 'exists:referrers,id',
            'started_at' => 'nullable|date',
            'ended_at' => 'nullable|date|after_or_equal:started_at',
            'active' => 'boolean',
        ];

        // Add specific validation for amount based on type
        if ($this->input('type') === 'PERCENTAGE') {
            $rules['amount'] = 'required|numeric|min:0|max:100'; // Ensure percentage is between 0-100
        } else {
            $rules['amount'] = 'required|numeric|min:0'; // Ensure fixed amount is not negative
        }

        return $rules;
    }

    /**
     * Get the error messages for the defined validation rules.
     *
     * @return array
     */
    public function messages()
    {
        return [
            'title.required' => 'The offer title is required.',
            'title.max' => 'The offer title must not exceed 255 characters.',
            'type.required' => 'Please select an offer type.',
            'type.in' => 'The selected offer type is invalid.',
            'amount.required' => 'The amount is required.',
            'amount.numeric' => 'The amount must be a number.',
            'amount.min' => 'The amount cannot be negative.',
            'amount.max' => 'The percentage cannot exceed 100%.',
            'tests.*.exists' => 'One or more selected tests do not exist.',
            'referrers.*.exists' => 'One or more selected referrers do not exist.',
            'started_at.date' => 'The start date must be a valid date.',
            'ended_at.date' => 'The end date must be a valid date.',
            'ended_at.after_or_equal' => 'The end date must be after or equal to the start date.',
        ];
    }

    /**
     * Prepare the data for validation.
     *
     * @return void
     */
    protected function prepareForValidation()
    {
        // Convert string boolean to actual boolean
        if ($this->has('active') && is_string($this->active)) {
            $this->merge([
                'active' => filter_var($this->active, FILTER_VALIDATE_BOOLEAN),
            ]);
        }

        // Format dates if they exist
        if ($this->has('started_at') && !empty($this->started_at)) {
            $this->merge([
                'started_at' => Carbon::parse($this->started_at)->format('Y-m-d'),
            ]);
        }

        if ($this->has('ended_at') && !empty($this->ended_at)) {
            $this->merge([
                'ended_at' => Carbon::parse($this->ended_at)->format('Y-m-d'),
            ]);
        }
    }
}
